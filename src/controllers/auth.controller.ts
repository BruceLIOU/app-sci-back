import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import * as AuthGoogleService from '../services/auth-google.service'

const db = require('../models')
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001'
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'
const JWT_EXPIRY = '7d'
const COOKIE_NAME = 'sci_token'

function issueToken(userId: number): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

function setTokenCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  })
}

// GET /api/auth/google/url
exports.getGoogleUrl = (_req: Request, res: Response) => {
  try {
    const url = AuthGoogleService.getAuthUrl()
    res.json({ url })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

// GET /api/auth/google/callback
exports.googleCallback = async (req: Request, res: Response) => {
  const { code } = req.query
  if (!code || typeof code !== 'string') {
    return res.redirect(`${FRONTEND_URL}/#/login?error=missing_code`)
  }
  try {
    const profile = await AuthGoogleService.getUserProfile(code)

    // Upsert user : créer ou mettre à jour
    let user = await db.User.findOne({ where: { google_id: profile.google_id } })
    if (!user) {
      // Premier utilisateur = admin
      const count = await db.User.count()
      user = await db.User.create({
        ...profile,
        role: count === 0 ? 'admin' : 'viewer',
      })
    } else {
      await user.update({ name: profile.name, avatar: profile.avatar })
    }

    const token = issueToken(user.id)
    setTokenCookie(res, token)
    res.redirect(`${FRONTEND_URL}/#/dashboard`)
  } catch (e: any) {
    console.error('Auth Google callback error:', e.message)
    res.redirect(`${FRONTEND_URL}/#/login?error=auth_failed`)
  }
}

// POST /api/auth/logout
exports.logout = (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME)
  res.json({ message: 'Déconnecté.' })
}

// GET /api/auth/me
exports.me = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      preferences: JSON.parse(user.preferences || '{}'),
    })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

// PUT /api/auth/preferences
exports.updatePreferences = async (req: Request, res: Response) => {
  const f = (req as any).fields || {}
  try {
    const user = (req as any).user
    const current = JSON.parse(user.preferences || '{}')
    // Fusionner les préférences envoyées
    const updated = { ...current }
    if (f.darkMode !== undefined) updated.darkMode = f.darkMode === 'true'
    await user.update({ preferences: JSON.stringify(updated) })
    res.json({ preferences: updated })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

// PUT /api/auth/profile
exports.updateProfile = async (req: Request, res: Response) => {
  const f = (req as any).fields || {}
  try {
    const user = (req as any).user
    if (f.name) await user.update({ name: f.name })
    res.json({
      id: user.id,
      email: user.email,
      name: f.name || user.name,
      avatar: user.avatar,
      role: user.role,
      preferences: JSON.parse(user.preferences || '{}'),
    })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}
