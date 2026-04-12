import { Request, Response } from 'express'
import { Op } from 'sequelize'

const db = require('../models')

// GET /api/notifications?unread=true
exports.findAll = async (req: Request, res: Response) => {
  try {
    const where: any = {}
    if (req.query.unread === 'true') where.is_read = false
    const notifications = await db.Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
    })
    res.json(notifications)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

// GET /api/notifications/unread-count
exports.unreadCount = async (_req: Request, res: Response) => {
  try {
    const count = await db.Notification.count({ where: { is_read: false } })
    res.json({ count })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

// PUT /api/notifications/mark-all-read
exports.markAllRead = async (_req: Request, res: Response) => {
  try {
    await db.Notification.update({ is_read: true }, { where: { is_read: false } })
    res.json({ message: 'Toutes les notifications marquées comme lues.' })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

// PUT /api/notifications/:id/read
exports.markRead = async (req: Request, res: Response) => {
  try {
    const notif = await db.Notification.findByPk(req.params.id)
    if (!notif) return res.status(404).json({ message: 'Notification introuvable.' })
    await notif.update({ is_read: true })
    res.json(notif)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

// DELETE /api/notifications/:id
exports.delete = async (req: Request, res: Response) => {
  try {
    const notif = await db.Notification.findByPk(req.params.id)
    if (!notif) return res.status(404).json({ message: 'Notification introuvable.' })
    await notif.destroy()
    res.json({ message: 'Notification supprimée.' })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

// POST /api/notifications/bulk-delete
exports.bulkDelete = async (req: Request, res: Response) => {
  try {
    const f = (req as any).fields || {}
    const ids = JSON.parse((f.ids as string) || '[]')
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: 'IDs requis.' })
    await db.Notification.destroy({ where: { id: { [Op.in]: ids } } })
    res.json({ message: `${ids.length} notification(s) supprimée(s).` })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}
