import { Request, Response } from 'express'
import * as GoogleCalendarService from '../services/google-calendar.service'

const db = require('../models')
const { Visit, Property, Tenant } = db

const include = [
  { model: Property, attributes: ['id', 'type', 'address', 'city'] },
  { model: Tenant, attributes: ['id', 'civility', 'firstname', 'lastname'] },
]

async function syncCreate(visit: any) {
  const config = await db.SciConfig.findOne()
  if (!config?.google_refresh_token) return
  try {
    const eventId = await GoogleCalendarService.createGoogleEvent(config.google_refresh_token, {
      title: visit.title,
      description: visit.description,
      date: visit.date,
      time: visit.time,
      duration: visit.duration,
      contact_name: visit.contact_name,
      contact_email: visit.contact_email,
      notes: visit.notes,
    })
    await visit.update({ google_event_id: eventId })
  } catch (e: any) {
    console.error('Google Calendar sync (create) error:', e.message)
  }
}

async function syncUpdate(visit: any) {
  const config = await db.SciConfig.findOne()
  if (!config?.google_refresh_token) return
  try {
    if (visit.google_event_id) {
      await GoogleCalendarService.updateGoogleEvent(config.google_refresh_token, visit.google_event_id, {
        title: visit.title,
        description: visit.description,
        date: visit.date,
        time: visit.time,
        duration: visit.duration,
        contact_name: visit.contact_name,
        contact_email: visit.contact_email,
        notes: visit.notes,
      })
    } else {
      await syncCreate(visit)
    }
  } catch (e: any) {
    console.error('Google Calendar sync (update) error:', e.message)
  }
}

async function syncDelete(visit: any) {
  const config = await db.SciConfig.findOne()
  if (!config?.google_refresh_token || !visit.google_event_id) return
  try {
    await GoogleCalendarService.deleteGoogleEvent(config.google_refresh_token, visit.google_event_id)
  } catch (e: any) {
    console.error('Google Calendar sync (delete) error:', e.message)
  }
}

// --- CRUD ---

exports.findAll = async (_req: Request, res: Response) => {
  try {
    const data = await Visit.findAll({ include, order: [['date', 'ASC'], ['time', 'ASC']] })
    res.json(data)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.findOne = async (req: Request, res: Response) => {
  try {
    const data = await Visit.findByPk(req.params.id, { include })
    if (!data) return res.status(404).json({ message: 'Visite introuvable.' })
    res.json(data)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.create = async (req: Request, res: Response) => {
  const f = (req as any).fields || {}
  if (!f.title || !f.property_id || !f.date)
    return res.status(400).json({ message: 'Titre, bien et date obligatoires.' })
  try {
    const visit = await Visit.create({
      title: f.title,
      description: f.description || null,
      property_id: f.property_id,
      tenant_id: f.tenant_id || null,
      contact_name: f.contact_name || null,
      contact_email: f.contact_email || null,
      contact_phone: f.contact_phone || null,
      date: f.date,
      time: f.time || '10:00',
      duration: f.duration ? Number(f.duration) : 60,
      type: f.type || 'visite',
      notes: f.notes || null,
    })
    await syncCreate(visit)
    res.status(201).json(visit)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.update = async (req: Request, res: Response) => {
  const f = (req as any).fields || {}
  try {
    const visit = await Visit.findByPk(req.params.id)
    if (!visit) return res.status(404).json({ message: 'Visite introuvable.' })
    await visit.update({
      title: f.title,
      description: f.description || null,
      property_id: f.property_id,
      tenant_id: f.tenant_id || null,
      contact_name: f.contact_name || null,
      contact_email: f.contact_email || null,
      contact_phone: f.contact_phone || null,
      date: f.date,
      time: f.time,
      duration: f.duration ? Number(f.duration) : visit.duration,
      type: f.type,
      status: f.status,
      notes: f.notes || null,
    })
    await syncUpdate(visit)
    res.json(visit)
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.delete = async (req: Request, res: Response) => {
  try {
    const visit = await Visit.findByPk(req.params.id)
    if (!visit) return res.status(404).json({ message: 'Visite introuvable.' })
    await syncDelete(visit)
    await visit.destroy()
    res.json({ message: 'Visite supprimée.', isDeleted: true })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

// --- Google Calendar OAuth ---

exports.googleStatus = async (_req: Request, res: Response) => {
  try {
    const config = await db.SciConfig.findOne()
    res.json({ connected: !!(config?.google_refresh_token) })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.googleAuthUrl = (_req: Request, res: Response) => {
  try {
    const url = GoogleCalendarService.getAuthUrl()
    res.json({ url })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}

exports.googleCallback = async (req: Request, res: Response) => {
  const { code } = req.query
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001'
  if (!code || typeof code !== 'string') {
    return res.redirect(`${frontendUrl}/admin/visits?google=error`)
  }
  try {
    const { refresh_token } = await GoogleCalendarService.exchangeCodeForTokens(code)
    let config = await db.SciConfig.findOne()
    if (!config) config = await db.SciConfig.create({})
    await config.update({ google_refresh_token: refresh_token })
    res.redirect(`${frontendUrl}/admin/visits?google=success`)
  } catch (e: any) {
    console.error('Google OAuth callback error:', e.message)
    res.redirect(`${frontendUrl}/admin/visits?google=error`)
  }
}

exports.googleDisconnect = async (_req: Request, res: Response) => {
  try {
    const config = await db.SciConfig.findOne()
    if (config) await config.update({ google_refresh_token: null })
    res.json({ message: 'Google Calendar déconnecté.' })
  } catch (e: any) { res.status(500).json({ message: e.message }) }
}
