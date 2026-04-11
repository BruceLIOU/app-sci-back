import { Request, Response } from 'express'
const db = require('../models')
const { Associate } = db

exports.create = async (req: Request, res: Response) => {
  const { civility, firstname, lastname, email, phone, address, shares, role } = req.fields
  if (!lastname || !shares) return res.status(400).json({ message: 'Nom et parts obligatoires.' })
  try {
    const result = await Associate.create({ civility: civility || 'MR', firstname: firstname || '', lastname, email: email || '', phone: phone || '', address: address || '', shares, role: role || 'Associé' })
    res.status(201).json(result)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.findAll = async (_req: Request, res: Response) => {
  try {
    const data = await Associate.findAll({ order: [['shares', 'DESC']] })
    res.status(200).json(data)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.findOne = async (req: Request, res: Response) => {
  try {
    const data = await Associate.findByPk(req.params.id)
    if (!data) return res.status(404).json({ message: 'Associé introuvable.' })
    res.status(200).json(data)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.update = async (req: Request, res: Response) => {
  const { civility, firstname, lastname, email, phone, address, shares, role } = req.fields
  try {
    const [num] = await Associate.update({ civility, firstname, lastname, email, phone, address, shares, role }, { where: { id: req.params.id } })
    if (num > 0) return res.status(200).json({ message: 'Associé mis à jour.' })
    res.status(404).json({ message: 'Associé introuvable.' })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.delete = async (req: Request, res: Response) => {
  try {
    const num = await Associate.destroy({ where: { id: req.params.id } })
    if (num === 1) return res.status(200).json({ message: 'Associé supprimé.', isDeleted: true })
    res.status(404).json({ message: 'Associé introuvable.', isDeleted: false })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}
