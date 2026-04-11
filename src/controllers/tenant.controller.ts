import { Request, Response } from 'express'

const db = require('../models')
const Tenant = db.Tenant
const Property = db.Property

exports.create = async (req: Request, res: Response) => {
  if (!req.fields.lastname) {
    return res.status(400).json({ message: 'Le nom ne peut pas être vide !' })
  }

  const tenant = {
    civility: req.fields.civility,
    firstname: req.fields.firstname,
    lastname: req.fields.lastname,
    email: req.fields.email,
    mobile: req.fields.mobile,
    property_id: req.fields.property_id || null,
  }

  try {
    const result = await Tenant.create(tenant)
    res.status(201).json(result)
  } catch (error: any) {
    console.log(error.message)
    res.status(500).json({ message: 'Erreur lors de la création du locataire.' })
  }
}

exports.findAll = async (req: Request, res: Response) => {
  try {
    const data = await Tenant.findAll({
      include: [{ model: Property, attributes: ['id', 'type', 'city', 'area', 'address'] }],
    })
    res.status(200).json(data)
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

exports.findOne = async (req: Request, res: Response) => {
  const id = req.params.id
  try {
    const data = await Tenant.findByPk(id, {
      include: [{ model: Property, attributes: ['id', 'type', 'city', 'area', 'address'] }],
    })
    if (data) {
      res.status(200).json(data)
    } else {
      res.status(404).json({ message: `Locataire avec id=${id} introuvable.` })
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de la récupération du locataire id=' + id })
  }
}

exports.update = async (req: Request, res: Response) => {
  const id = req.params.id
  const { civility, firstname, lastname, email, mobile, property_id } = req.fields
  try {
    const result = await Tenant.update(
      { civility, firstname, lastname, email, mobile, property_id: property_id || null },
      { where: { id } }
    )
    if (result[0] > 0) {
      res.status(200).json({ message: 'Locataire mis à jour avec succès.' })
    } else {
      res.status(404).json({ message: `Locataire avec id=${id} introuvable.` })
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du locataire id=' + id })
  }
}

exports.delete = async (req: Request, res: Response) => {
  const id = req.params.id
  try {
    const num = await Tenant.destroy({ where: { id } })
    if (num === 1) {
      res.status(200).json({ message: 'Locataire supprimé avec succès !', isDeleted: true })
    } else {
      res.status(404).json({ message: `Locataire avec id=${id} introuvable.`, isDeleted: false })
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de la suppression du locataire id=' + id })
  }
}
