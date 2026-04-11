import { Request, Response } from 'express'

const db = require('../models')
const Property = db.Property

exports.create = async (req: Request, res: Response) => {
  if (!req.fields.city) {
    res.status(400).send({
      message: 'City can not be empty!',
    })
    return
  }

  const property = {
    address: req.fields.address,
    zipcode: req.fields.zipcode,
    city: req.fields.city,
    type: req.fields.type,
    pieces: req.fields.pieces,
    area: req.fields.area,
  }

  try {
    const result = await Property.create(property)

    if (result) {
      res.status(201).json(result)
    } else {
      res.status(500).json({
        message: `Cannot create Property. Maybe Property req.fields is empty!`,
      })
    }
  } catch (error: any) {
    console.log(error.message)
    res.status(500).json({
      message: 'Error creating Property.',
    })
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
  const { address, zipcode, city, type, pieces, area } = req.fields
  const { thumbnail, images } = req.files
  const id = req.params.id
  try {
    const result = await Property.update(
      { address, zipcode, city, type, pieces, area, thumbnail, images },
      {
        where: { id: id },
      }
    )
    if (result.length > 0) {
      res.status(201).json({
        message: 'Property was updated successfully.',
      })
    } else {
      res.status(500).json({
        message: `Cannot update Property with id=${id}. Maybe Property was not found or req.fields is empty!`,
      })
    }
  } catch (error: any) {
    console.log(error.message)
    res.status(500).json({
      message: 'Error updating Property with id=' + id,
    })
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
