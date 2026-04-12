import { Request, Response } from 'express'
import cloudinary from '../config/cloudinary.config'
import { generateAndSaveQuittancePdf } from '../services/pdf.service'
const db = require('../models')
const { Payment, Tenant, Property, Lease } = db
const Quittance = db.Quittance
const Document = db.Document

const getPublicId = (url: string): string => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i)
  return match ? match[1] : ''
}

const include = [
  { model: Tenant, attributes: ['id', 'civility', 'firstname', 'lastname'] },
  { model: Property, attributes: ['id', 'type', 'city', 'address'] },
]

exports.create = async (req: Request, res: Response) => {
  if (!req.fields.amount) return res.status(400).json({ message: 'Le montant ne peut pas être vide !' })
  try {
    const { tenant_id, property_id, amount, due_date, paid_date, status, month } = req.fields
    const result = await Payment.create({ tenant_id: tenant_id || null, property_id: property_id || null, amount, due_date: due_date || null, paid_date: paid_date || null, status: status || 'pending', month })
    res.status(201).json(result)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.findAll = async (_req: Request, res: Response) => {
  try {
    const data = await Payment.findAll({ include, order: [['due_date', 'DESC']] })
    res.status(200).json(data)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.findOne = async (req: Request, res: Response) => {
  try {
    const data = await Payment.findByPk(req.params.id, { include })
    if (!data) return res.status(404).json({ message: `Paiement id=${req.params.id} introuvable.` })
    res.status(200).json(data)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.update = async (req: Request, res: Response) => {
  const { tenant_id, property_id, amount, due_date, paid_date, status, month } = req.fields
  try {
    // Charger le paiement avant mise à jour pour comparer les statuts
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        { model: Quittance },
        { model: Lease },
      ],
    })
    if (!payment) return res.status(404).json({ message: 'Paiement introuvable.' })

    const prevStatus = payment.status
    const newStatus = status as string

    await Payment.update(
      { tenant_id, property_id, amount, due_date, paid_date: paid_date || null, status, month },
      { where: { id: req.params.id } }
    )

    // ─── Passage à "payé" → créer quittance + PDF automatiquement ────────────
    if (newStatus === 'paid' && prevStatus !== 'paid' && !payment.Quittance) {
      // Trouver le bail via lease_id du paiement, ou fallback sur tenant+property
      let lease = payment.Lease
      if (!lease) {
        const tid = payment.tenant_id || tenant_id
        const pid = payment.property_id || property_id
        if (tid && pid) {
          lease = await Lease.findOne({ where: { tenant_id: tid, property_id: pid, status: 'active' } })
        }
      }

      const rentAmount = lease ? parseFloat(lease.rent_amount) : parseFloat(amount as string || '0')
      const chargesAmount = lease ? parseFloat(lease.charges_amount || 0) : parseFloat(payment.charges_amount || '0')

      const year = new Date().getFullYear()
      const count: number = await Quittance.count()
      const number = `Q-${year}-${String(count + 1).padStart(3, '0')}`

      const quittance = await Quittance.create({
        number,
        tenant_id: payment.tenant_id || tenant_id || null,
        property_id: payment.property_id || property_id || null,
        lease_id: lease ? lease.id : null,
        payment_id: payment.id,
        period: payment.month || month || '',
        rent_amount: rentAmount.toFixed(2),
        charges_amount: chargesAmount.toFixed(2),
        total_amount: (rentAmount + chargesAmount).toFixed(2),
        issue_date: new Date().toISOString().split('T')[0],
      })

      // Génération PDF en arrière-plan (ne bloque pas la réponse)
      generateAndSaveQuittancePdf(quittance.id).catch((err: any) =>
        console.error('Erreur génération PDF quittance:', err)
      )
    }

    // ─── Dépaiement → supprimer la quittance et son PDF ──────────────────────
    if ((newStatus === 'pending' || newStatus === 'late') && prevStatus === 'paid' && payment.Quittance) {
      const qId = payment.Quittance.id
      const docs = await Document.findAll({ where: { entity_type: 'quittance', entity_id: qId } })
      await Promise.allSettled(
        docs.map((d: any) => cloudinary.uploader.destroy(getPublicId(d.file_url), { resource_type: 'raw' }))
      )
      await Document.destroy({ where: { entity_type: 'quittance', entity_id: qId } })
      await Quittance.destroy({ where: { id: qId } })
    }

    return res.status(200).json({ message: 'Paiement mis à jour.' })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.delete = async (req: Request, res: Response) => {
  try {
    const num = await Payment.destroy({ where: { id: req.params.id } })
    if (num === 1) return res.status(200).json({ message: 'Paiement supprimé.', isDeleted: true })
    res.status(404).json({ message: 'Paiement introuvable.', isDeleted: false })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}
