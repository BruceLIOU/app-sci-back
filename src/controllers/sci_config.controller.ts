import { Request, Response } from 'express'

const db = require('../models')

// GET /api/sci-config — retourne (ou crée) la configuration singleton
exports.get = async (req: Request, res: Response) => {
  try {
    let config = await db.SciConfig.findOne()
    if (!config) config = await db.SciConfig.create({})
    res.json(config)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

// PUT /api/sci-config — met à jour la configuration
exports.update = async (req: Request, res: Response) => {
  try {
    const fields = (req as any).fields || {}
    let config = await db.SciConfig.findOne()
    if (!config) {
      config = await db.SciConfig.create(fields)
    } else {
      await config.update(fields)
    }
    res.json(config)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}
