import { Request, Response } from 'express'
import { startCron } from '../services/cron-manager.service'
import { encrypt, decrypt, isEncrypted } from '../utils/crypto.util'
import { testSmtpConnection } from '../services/email.service'

const db = require('../models')

const ENCRYPTED_FIELDS = ['smtp_pass', 'imap_pass'] as const

type OwnerProfileType = 'SCI' | 'PROFESSIONAL' | 'INDIVIDUAL'

/**
 * Normalise et valide le type de profil bailleur
 * - 'SCI' : Société Civile Immobilière
 * - 'PROFESSIONAL' : Bailleur professionnel (entreprise)
 * - 'INDIVIDUAL' : Bailleur particulier (personne physique)
 */
function normalizeOwnerProfileType(value: unknown): OwnerProfileType {
  const upper = String(value || '').toUpperCase().trim()
  if (upper === 'SCI') return 'SCI'
  if (upper === 'PROFESSIONAL') return 'PROFESSIONAL'
  return 'INDIVIDUAL'
}

function decryptConfig(config: any): any {
  const plain: any = config.toJSON ? config.toJSON() : { ...config }
  plain.owner_profile_type = normalizeOwnerProfileType(plain.owner_profile_type)
  for (const field of ENCRYPTED_FIELDS) {
    if (plain[field]) plain[field] = decrypt(plain[field]) ?? ''
  }
  return plain
}

function normalizeSiret(value: unknown): string {
  return String(value || '').replace(/\D/g, '')
}

function buildAddressFromSeat(seat: any): string {
  if (!seat) return ''
  const parts = [seat.numero_voie, seat.type_voie, seat.libelle_voie].filter(Boolean)
  return parts.join(' ').trim()
}

// GET /api/owner-config/siret/:siret — recupere les infos entreprise via API publique
exports.lookupSiret = async (req: Request, res: Response) => {
  try {
    const siret = normalizeSiret(req.params.siret)
    if (siret.length !== 14) {
      return res.status(400).json({ message: 'SIRET invalide: 14 chiffres attendus.' })
    }

    const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siret}&per_page=1`, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      return res.status(502).json({ message: 'Service SIRET indisponible, reessayez plus tard.' })
    }

    const data: any = await response.json()
    const first = data?.results?.[0]

    if (!first) {
      return res.status(404).json({ message: 'Aucune entreprise trouvee pour ce SIRET.' })
    }

    const seat = first.siege || first.matching_etablissements?.[0] || null
    const companyName = first.nom_complet || first.nom_raison_sociale || first.denomination || ''
    const legalForm = first.forme_juridique || first.forme_juridique_libelle || ''
    const city = seat?.libelle_commune || seat?.commune || ''

    const payload = {
      siret,
      siren: first.siren || siret.slice(0, 9),
      name: companyName,
      legal_form: legalForm,
      address: buildAddressFromSeat(seat),
      zipcode: seat?.code_postal || '',
      city,
      rcs: first.siren ? `RCS ${city || ''} ${first.siren}`.trim() : '',
    }

    return res.json(payload)
  } catch (e: any) {
    return res.status(500).json({ message: e.message || 'Erreur lookup SIRET.' })
  }
}

// POST /api/owner-config/test-email — teste la connexion SMTP et envoie un email de test
exports.testEmail = async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any)?.user?.email
    if (!userEmail) {
      return res.status(400).json({ message: 'Email utilisateur introuvable pour le test SMTP.' })
    }
    await testSmtpConnection(userEmail)
    return res.json({ message: `Email de test envoye a ${userEmail}.` })
  } catch (e: any) {
    return res.status(500).json({ message: e.message || 'Echec du test SMTP.' })
  }
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
