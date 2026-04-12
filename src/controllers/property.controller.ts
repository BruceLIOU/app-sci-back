import { Request, Response } from 'express'
import cloudinary from '../config/cloudinary.config'

const db = require('../models')
const Property = db.Property

interface FormidableFile {
  name: string
  path: string
  size: number
  type: string
}

const uploadToCloudinary = async (file: FormidableFile): Promise<string> => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'landlords/properties',
    resource_type: 'image',
  })
  return result.secure_url
}

exports.create = async (req: Request, res: Response) => {
  if (!req.fields?.city) {
    res.status(400).send({ message: 'City can not be empty!' })
    return
  }

  try {
    let thumbnailUrl: string | null = null
    let imagesUrls: string[] = []

    if (req.files?.thumbnail) {
      thumbnailUrl = await uploadToCloudinary(req.files.thumbnail as FormidableFile)
    }

    if (req.files?.images) {
      const imgs = req.files.images
      const imgArray = Array.isArray(imgs) ? imgs : [imgs as FormidableFile]
      imagesUrls = await Promise.all(imgArray.map(uploadToCloudinary))
    }

    const lat = req.fields?.latitude ? parseFloat(String(req.fields.latitude)) : null
    const lng = req.fields?.longitude ? parseFloat(String(req.fields.longitude)) : null

    const property = {
      address:   req.fields.address,
      zipcode:   req.fields.zipcode,
      city:      req.fields.city,
      type:      req.fields.type,
      pieces:    req.fields.pieces,
      area:      req.fields.area,
      latitude:  lat,
      longitude: lng,
      thumbnail: thumbnailUrl,
      images:    imagesUrls.length ? JSON.stringify(imagesUrls) : null,
      rooms:     req.fields.rooms ? String(req.fields.rooms) : null,
      features:  req.fields.features ? String(req.fields.features) : null,
      comments:  req.fields.comments ? String(req.fields.comments) : null,
    }

    const result = await Property.create(property)
    res.status(201).json(result)
  } catch (error: any) {
    console.log(error.message)
    res.status(500).json({ message: 'Error creating Property.' })
  }
}

exports.findAll = async (req: Request, res: Response) => {
  await Property.findAll()
    .then((data: any) => {
      res.status(201).json(data)
    })
    .catch((err: any) => {
      res.status(500).json({
        message: err.message || 'Some error occurred while retrieving tutorials.',
      })
    })
}

exports.findOne = async (req: Request, res: Response) => {
  const id = req.params.id
  try {
    const data = await Property.findByPk(id)
    if (data) {
      res.status(200).json(data)
    } else {
      res.status(404).json({ message: `Property with id=${id} not found.` })
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving Property with id=' + id })
  }
}

exports.update = async (req: Request, res: Response) => {
  const id = req.params.id
  try {
    const updateData: Record<string, any> = {}

    const scalarFields = ['address', 'zipcode', 'city', 'type', 'pieces', 'area', 'rooms', 'features', 'comments'] as const
    scalarFields.forEach((f) => {
      if (req.fields?.[f] !== undefined) updateData[f] = req.fields[f]
    })

    if (req.fields?.latitude !== undefined && req.fields.latitude !== '') {
      updateData.latitude = parseFloat(String(req.fields.latitude))
    }
    if (req.fields?.longitude !== undefined && req.fields.longitude !== '') {
      updateData.longitude = parseFloat(String(req.fields.longitude))
    }

    if (req.files?.thumbnail) {
      updateData.thumbnail = await uploadToCloudinary(req.files.thumbnail as FormidableFile)
    }

    if (req.files?.images) {
      const imgs = req.files.images
      const imgArray = Array.isArray(imgs) ? imgs : [imgs as FormidableFile]
      const urls = await Promise.all(imgArray.map(uploadToCloudinary))
      updateData.images = JSON.stringify(urls)
    }

    const [count] = await Property.update(updateData, { where: { id } })
    if (count > 0) {
      res.status(200).json({ message: 'Property was updated successfully.' })
    } else {
      res.status(404).json({ message: `Cannot update Property with id=${id}. Not found.` })
    }
  } catch (error: any) {
    console.log(error.message)
    res.status(500).json({ message: 'Error updating Property with id=' + id })
  }
}

exports.delete = async (req: Request, res: Response) => {
  const id = req.params.id
  await Property.destroy({
    where: { id: id },
  })
    .then((num: number) => {
      if (num == 1) {
        res.status(201).json({
          message: 'Property was deleted successfully!',
          isDeleted: true,
        })
      } else {
        res.status(500).json({
          message: `Cannot delete Property with id=${id}. Maybe Property was not found!`,
          isDeleted: false,
        })
      }
    })
    .catch((err: any) => {
      res.status(500).send({
        message: 'Could not delete Property with id=' + id,
      })
    })
}

exports.deleteAll = async (req: Request, res: Response) => {
  try {
    const num = await Property.destroy({ where: {}, truncate: false })
    res.status(200).json({ message: `${num} Properties were deleted successfully!` })
  } catch (error: any) {
    res.status(500).json({ message: 'Some error occurred while removing all properties.' })
  }
}

exports.findAllPublished = async (req: Request, res: Response) => {
  await Property.findAll()
    .then((data: any) => res.status(200).json(data))
    .catch((err: any) => res.status(500).json({ message: err.message }))
}
