import { Request, Response } from 'express'
import cloudinary from '../config/cloudinary.config'

const db = require('../models')
const Document = db.Document

interface FormidableFile {
  name: string
  path: string
  size: number
  type: string
}

const getPublicId = (url: string): string => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i)
  return match ? match[1] : ''
}

exports.findAll = async (req: Request, res: Response) => {
  try {
    const { entity_type, entity_id } = req.query
    const where: Record<string, any> = {}
    if (entity_type) where.entity_type = entity_type
    if (entity_id) where.entity_id = entity_id
    const data = await Document.findAll({ where, order: [['createdAt', 'DESC']] })
    res.status(200).json(data)
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

exports.findOne = async (req: Request, res: Response) => {
  const id = req.params.id
  try {
    const data = await Document.findByPk(id)
    if (data) res.status(200).json(data)
    else res.status(404).json({ message: `Document id=${id} introuvable.` })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

exports.create = async (req: Request, res: Response) => {
  const { title, category, entity_type, entity_id, notes } = req.fields || {}
  if (!title || !entity_type || !entity_id) {
    return res.status(400).json({ message: 'Titre, type et identifiant de l\'entité sont obligatoires.' })
  }
  if (!req.files?.file) {
    return res.status(400).json({ message: 'Un fichier est obligatoire.' })
  }

  try {
    const file = req.files.file as FormidableFile
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `sci/documents/${entity_type}`,
      resource_type: 'raw',
      use_filename: true,
      unique_filename: true,
    })

    const doc = await Document.create({
      title,
      category: category || 'autre',
      file_url: result.secure_url,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      entity_type,
      entity_id: Number(entity_id),
      notes: notes || null,
    })
    res.status(201).json(doc)
  } catch (error: any) {
    console.error(error.message)
    res.status(500).json({ message: 'Erreur lors de la création du document.' })
  }
}

exports.delete = async (req: Request, res: Response) => {
  const id = req.params.id
  try {
    const existing = await Document.findByPk(id)
    if (!existing) return res.status(404).json({ message: `Document id=${id} introuvable.` })

    // Suppression sur Cloudinary (best-effort)
    const publicId = getPublicId(existing.file_url)
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => {})
    }

    await Document.destroy({ where: { id } })
    res.status(200).json({ message: 'Document supprimé.', isDeleted: true })
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de la suppression du document id=' + id })
  }
}
