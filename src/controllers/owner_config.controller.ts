import { Request, Response } from 'express'
import { startCron } from '../services/cron-manager.service'
import { encrypt, decrypt, isEncrypted } from '../utils/crypto.util'

const db = require('../models')

const ENCRYPTED_FIELDS = ['smtp_pass', 'imap_pass'] as const

function normalizeOwnerProfileType(value: unknown): 'SCI' | 'INDIVIDUAL' {
  return String(value || '').toUpperCase() === 'SCI' ? 'SCI' : 'INDIVIDUAL'
}

function decryptConfig(config: any): any {
  const plain: any = config.toJSON ? config.toJSON() : { ...config }
  plain.owner_profile_type = normalizeOwnerProfileType(plain.owner_profile_type)
  for (const field of ENCRYPTED_FIELDS) {
    if (plain[field]) plain[field] = decrypt(plain[field]) ?? ''
  }
  return plain
}

// GET /api/owner-config — retourne (ou crée) la configuration singleton
exports.get = async (req: Request, res: Response) => {
  try {
    let config = await db.OwnerConfig.findOne()
    if (!config) config = await db.OwnerConfig.create({})
    res.json(decryptConfig(config))
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

// PUT /api/owner-config — met à jour la configuration
exports.update = async (req: Request, res: Response) => {
  try {
    const fields: any = (req as any).fields || {}
    if (fields.owner_profile_type !== undefined) {
      fields.owner_profile_type = normalizeOwnerProfileType(fields.owner_profile_type)
    }
    // Chiffrer les mots de passe si fournis en clair
    for (const field of ENCRYPTED_FIELDS) {
      if (fields[field] && !isEncrypted(fields[field])) {
        fields[field] = encrypt(fields[field])
      }
    }
    let config = await db.OwnerConfig.findOne()
    if (!config) {
      config = await db.OwnerConfig.create(fields)
    } else {
      await config.update(fields)
    }
    // Recharger le cron si le schedule ou l'activation ont changé
    const schedule = config.charge_cron_schedule || '0 8 * * *'
    const enabled = config.charge_cron_enabled !== false
    startCron(schedule, enabled)
    res.json(decryptConfig(config))
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}
