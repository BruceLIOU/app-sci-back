import { Request, Response } from 'express'
const db = require('../models')
const { Payment, Tenant, Property } = db

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
    const [num] = await Payment.update({ tenant_id, property_id, amount, due_date, paid_date: paid_date || null, status, month }, { where: { id: req.params.id } })
    if (num > 0) return res.status(200).json({ message: 'Paiement mis à jour.' })
    res.status(404).json({ message: 'Paiement introuvable.' })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.delete = async (req: Request, res: Response) => {
  try {
    const num = await Payment.destroy({ where: { id: req.params.id } })
    if (num === 1) return res.status(200).json({ message: 'Paiement supprimé.', isDeleted: true })
    res.status(404).json({ message: 'Paiement introuvable.', isDeleted: false })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}
