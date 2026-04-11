import { Request, Response } from 'express'
const db = require('../models')
const { Quittance, Tenant, Property, Lease } = db

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
  try {
    const num = await Quittance.destroy({ where: { id: req.params.id } })
    if (num === 1) return res.status(200).json({ message: 'Quittance supprimée.', isDeleted: true })
    res.status(404).json({ message: 'Quittance introuvable.', isDeleted: false })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}
