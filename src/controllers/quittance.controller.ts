import { Request, Response } from 'express'
import cloudinary from '../config/cloudinary.config'
import { generateAndSaveQuittancePdf } from '../services/pdf.service'
import { buildZipBuffer, sendPdfByEmail, sendZipByEmail } from '../services/email.service'
import { createNotification } from '../services/notification.service'
import { generateQuittancePdf } from '../utils/pdf.generator'
const db = require('../models')
const { Quittance, Tenant, Property, Lease } = db
const Document = db.Document

const getPublicId = (url: string): string => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i)
  return match ? match[1] : ''
}

async function deleteEntityDocuments(entity_type: string, entity_id: number) {
  const docs = await Document.findAll({ where: { entity_type, entity_id } })
  await Promise.allSettled(docs.map((d: any) => cloudinary.uploader.destroy(getPublicId(d.file_url), { resource_type: 'raw' })))
  await Document.destroy({ where: { entity_type, entity_id } })
}

const include = [
  { model: Tenant, attributes: ['id', 'civility', 'firstname', 'lastname', 'email', 'mobile'] },
  { model: Property, attributes: ['id', 'type', 'city', 'address', 'zipcode'] },
  { model: Lease, attributes: ['id', 'rent_amount', 'charges_amount', 'start_date'] },
]

const generateNumber = async (): Promise<string> => {
  const year = new Date().getFullYear()
  const count: number = await Quittance.count()
  return `Q-${year}-${String(count + 1).padStart(3, '0')}`
}

exports.create = async (req: Request, res: Response) => {
  const { tenant_id, property_id, lease_id, payment_id, period, rent_amount, charges_amount, total_amount, issue_date } = req.fields
  if (!period || !rent_amount) return res.status(400).json({ message: 'Période et loyer obligatoires.' })
  try {
    const number = await generateNumber()
    const result = await Quittance.create({ number, tenant_id: tenant_id || null, property_id: property_id || null, lease_id: lease_id || null, payment_id: payment_id || null, period, rent_amount, charges_amount: charges_amount || 0, total_amount: total_amount || rent_amount, issue_date: issue_date || new Date().toISOString().split('T')[0] })
    res.status(201).json(result)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.findAll = async (_req: Request, res: Response) => {
  try {
    const data = await Quittance.findAll({ include, order: [['issue_date', 'DESC']] })
    res.status(200).json(data)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.findOne = async (req: Request, res: Response) => {
  try {
    const data = await Quittance.findByPk(req.params.id, { include })
    if (!data) return res.status(404).json({ message: 'Quittance introuvable.' })
    res.status(200).json(data)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.update = async (req: Request, res: Response) => {
  const { tenant_id, property_id, lease_id, payment_id, period, rent_amount, charges_amount, total_amount, issue_date } = req.fields
  try {
    const [num] = await Quittance.update({ tenant_id: tenant_id || null, property_id: property_id || null, lease_id: lease_id || null, payment_id: payment_id || null, period, rent_amount, charges_amount: charges_amount || 0, total_amount: total_amount || rent_amount, issue_date }, { where: { id: req.params.id } })
    if (num > 0) return res.status(200).json({ message: 'Quittance mise à jour.' })
    res.status(404).json({ message: 'Quittance introuvable.' })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.delete = async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  try {
    await deleteEntityDocuments('quittance', id)
    const num = await Quittance.destroy({ where: { id } })
    if (num === 1) return res.status(200).json({ message: 'Quittance supprimée.', isDeleted: true })
    res.status(404).json({ message: 'Quittance introuvable.', isDeleted: false })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.bulkDelete = async (req: Request, res: Response) => {
  try {
    const ids: number[] = JSON.parse((req.fields?.ids as string) || '[]')
    if (!ids.length) return res.status(400).json({ message: 'Aucun identifiant fourni.' })
    for (const id of ids) {
      await deleteEntityDocuments('quittance', id)
    }
    const num = await Quittance.destroy({ where: { id: ids } })
    res.status(200).json({ message: `${num} quittance(s) supprimée(s).`, deleted: num })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.bulkGeneratePdf = async (req: Request, res: Response) => {
  try {
    const ids: number[] = JSON.parse((req.fields?.ids as string) || '[]')
    if (!ids.length) return res.status(400).json({ message: 'Aucun identifiant fourni.' })
    const results = await Promise.allSettled(ids.map((id) => generateAndSaveQuittancePdf(id)))
    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    res.status(200).json({ message: `${succeeded} PDF généré(s)${failed > 0 ? `, ${failed} erreur(s)` : ''}.`, succeeded, failed })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.bulkEmail = async (req: Request, res: Response) => {
  try {
    const ids: number[] = JSON.parse((req.fields?.ids as string) || '[]')
    if (!ids.length) return res.status(400).json({ message: 'Aucun identifiant fourni.' })

    const quittanceInclude = [
      { model: Property, attributes: ['id', 'type', 'address', 'zipcode', 'city'] },
      { model: Tenant, attributes: ['id', 'civility', 'firstname', 'lastname', 'email'] },
    ]
    const landlord = await db.SciConfig.findOne()
    const appName = process.env.APP_NAME || 'App SCI'

    const quittances = await Quittance.findAll({ where: { id: ids }, include: quittanceInclude })

    // Grouper par locataire (email)
    const byEmail: Record<string, { tenant: any; quittances: any[] }> = {}
    for (const q of quittances) {
      const email = q.Tenant?.email
      if (!email) continue
      if (!byEmail[email]) byEmail[email] = { tenant: q.Tenant, quittances: [] }
      byEmail[email].quittances.push(q)
    }

    if (Object.keys(byEmail).length === 0) {
      return res.status(400).json({ message: 'Aucune quittance avec locataire ayant un email.' })
    }

    let sent = 0
    let errors = 0

    for (const [email, { tenant, quittances: tQuittances }] of Object.entries(byEmail)) {
      try {
        if (tQuittances.length === 1) {
          // Un seul PDF — pièce jointe directe
          const q = tQuittances[0]
          const buffer = await generateQuittancePdf(q, q.Property, tenant, landlord)
          const filename = `quittance_${(q.period || 'periode').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${tenant.lastname.toLowerCase()}.pdf`
          await sendPdfByEmail(
            email,
            `Votre quittance de loyer – ${q.period}`,
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2d6a4f;">Quittance de loyer – ${q.period}</h2>
              <p>Bonjour ${tenant.civility ? tenant.civility + ' ' : ''}${tenant.lastname},</p>
              <p>Veuillez trouver ci-joint votre quittance de loyer pour la période <strong>${q.period}</strong>.</p>
              <p>Montant total acquitté : <strong>${parseFloat(q.total_amount).toFixed(2)} €</strong></p>
              <p>Cordialement,<br><strong>${appName}</strong></p>
            </div>`,
            { filename, content: buffer },
          )
          const now = new Date()
          await q.update({ email_sent_at: now })
          await createNotification({
            type: 'email_sent',
            title: 'Quittance envoyée par email',
            message: `Période ${q.period} — envoyée à ${email}`,
            metadata: { reference_type: 'quittance', reference_id: q.id, recipient: email },
          })
        } else {
          // Plusieurs PDFs — ZIP
          const files: { filename: string; content: Buffer }[] = []
          for (const q of tQuittances) {
            const buffer = await generateQuittancePdf(q, q.Property, tenant, landlord)
            const filename = `quittance_${(q.period || 'periode').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${tenant.lastname.toLowerCase()}.pdf`
            files.push({ filename, content: buffer })
          }
          const zipBuffer = await buildZipBuffer(files)
          const periods = tQuittances.map((q: any) => q.period).join(', ')
          await sendZipByEmail(
            email,
            `Vos quittances de loyer`,
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2d6a4f;">Vos quittances de loyer</h2>
              <p>Bonjour ${tenant.civility ? tenant.civility + ' ' : ''}${tenant.lastname},</p>
              <p>Veuillez trouver ci-joint vos ${tQuittances.length} quittances de loyer (${periods}).</p>
              <p>Cordialement,<br><strong>${appName}</strong></p>
            </div>`,
            { filename: `quittances_${tenant.lastname.toLowerCase()}.zip`, content: zipBuffer },
          )
          const now = new Date()
          for (const q of tQuittances) {
            await q.update({ email_sent_at: now })
            await createNotification({
              type: 'email_sent',
              title: 'Quittance envoyée par email',
              message: `Période ${q.period} — envoyée à ${email}`,
              metadata: { reference_type: 'quittance', reference_id: q.id, recipient: email },
            })
          }
        }
        sent++
      } catch {
        errors++
      }
    }

    res.status(200).json({
      message: `${sent} email(s) envoyé(s)${errors > 0 ? `, ${errors} erreur(s)` : ''}.`,
      sent,
      errors,
    })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}
