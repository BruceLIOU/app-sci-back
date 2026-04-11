import { Request, Response } from 'express'
const db = require('../models')
const { Inspection, Tenant, Property, Lease } = db

const include = [
  { model: Tenant, attributes: ['id', 'civility', 'firstname', 'lastname'] },
  { model: Property, attributes: ['id', 'type', 'city', 'address'] },
  { model: Lease, attributes: ['id', 'start_date', 'rent_amount'] },
]

exports.create = async (req: Request, res: Response) => {
  const { property_id, tenant_id, lease_id, type, date, status, general_notes, rooms } = req.fields
  if (!property_id || !type || !date) return res.status(400).json({ message: 'Bien, type et date obligatoires.' })
  try {
    const result = await Inspection.create({ property_id, tenant_id: tenant_id || null, lease_id: lease_id || null, type, date, status: status || 'pending', general_notes: general_notes || '', rooms: rooms || '[]' })
    res.status(201).json(result)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.findAll = async (_req: Request, res: Response) => {
  try {
    const data = await Inspection.findAll({ include, order: [['date', 'DESC']] })
    res.status(200).json(data)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.findOne = async (req: Request, res: Response) => {
  try {
    const data = await Inspection.findByPk(req.params.id, { include })
    if (!data) return res.status(404).json({ message: 'État des lieux introuvable.' })
    res.status(200).json(data)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.update = async (req: Request, res: Response) => {
  const { property_id, tenant_id, lease_id, type, date, status, general_notes, rooms } = req.fields
  try {
    const [num] = await Inspection.update({ property_id, tenant_id: tenant_id || null, lease_id: lease_id || null, type, date, status, general_notes, rooms: rooms || '[]' }, { where: { id: req.params.id } })
    if (num > 0) return res.status(200).json({ message: 'État des lieux mis à jour.' })
    res.status(404).json({ message: 'État des lieux introuvable.' })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.delete = async (req: Request, res: Response) => {
  try {
    const num = await Inspection.destroy({ where: { id: req.params.id } })
    if (num === 1) return res.status(200).json({ message: 'État des lieux supprimé.', isDeleted: true })
    res.status(404).json({ message: 'État des lieux introuvable.', isDeleted: false })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}
