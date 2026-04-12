import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const db = require('../models')

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'
  try {
    const cookies = (req as any).cookies || {}
    const token = cookies['sci_token']
    if (!token) return res.status(401).json({ message: 'Non authentifié.' })

    const payload = jwt.verify(token, JWT_SECRET) as { id: number }
    const user = await db.User.findByPk(payload.id)
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable.' })

    ;(req as any).user = user
    next()
  } catch {
    res.status(401).json({ message: 'Token invalide ou expiré.' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Droits administrateur requis.' })
  }
  next()
}
