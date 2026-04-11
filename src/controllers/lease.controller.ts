import { Request, Response } from 'express'
const db = require('../models')
const { Lease, Property, Tenant } = db

const include = [
  { model: Property, attributes: ['id', 'type', 'city', 'address', 'zipcode'] },
  { model: Tenant, attributes: ['id', 'civility', 'firstname', 'lastname', 'email', 'mobile'] },
]

exports.create = async (req: Request, res: Response) => {
  const { property_id, tenant_id, type, start_date, end_date, rent_amount, charges_amount, deposit_amount, notice_period, status, notes } = req.fields
  if (!property_id || !start_date || !rent_amount) return res.status(400).json({ message: 'Bien, date de début et loyer obligatoires.' })
  try {
    const result = await Lease.create({ property_id, tenant_id: tenant_id || null, type, start_date, end_date: end_date || null, rent_amount, charges_amount: charges_amount || 0, deposit_amount: deposit_amount || 0, notice_period: notice_period || 3, status: status || 'active', notes: notes || null })
    res.status(201).json(result)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.findAll = async (_req: Request, res: Response) => {
  try {
    const data = await Lease.findAll({ include, order: [['start_date', 'DESC']] })
    res.status(200).json(data)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.findOne = async (req: Request, res: Response) => {
  try {
    const data = await Lease.findByPk(req.params.id, { include })
    if (!data) return res.status(404).json({ message: 'Bail introuvable.' })
    res.status(200).json(data)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.update = async (req: Request, res: Response) => {
  const { property_id, tenant_id, type, start_date, end_date, rent_amount, charges_amount, deposit_amount, notice_period, status, notes } = req.fields
  try {
    const [num] = await Lease.update({ property_id, tenant_id: tenant_id || null, type, start_date, end_date: end_date || null, rent_amount, charges_amount: charges_amount || 0, deposit_amount: deposit_amount || 0, notice_period, status, notes: notes || null }, { where: { id: req.params.id } })
    if (num > 0) return res.status(200).json({ message: 'Bail mis à jour.' })
    res.status(404).json({ message: 'Bail introuvable.' })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.delete = async (req: Request, res: Response) => {
  try {
    const num = await Lease.destroy({ where: { id: req.params.id } })
    if (num === 1) return res.status(200).json({ message: 'Bail supprimé.', isDeleted: true })
    res.status(404).json({ message: 'Bail introuvable.', isDeleted: false })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}
