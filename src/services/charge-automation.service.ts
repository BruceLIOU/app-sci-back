import { fetchMateraEmails, RawMateraEmail } from './imap.service'
import { parseMateraEmail, isFundCallEmail } from './matera-parser.service'
import { Op } from 'sequelize'

const db = require('../models')
const { Charge, ProcessedEmail, Property } = db

export interface SyncResult {
  processed: number
  created: number
  skipped: number
  errors: string[]
}

/**
 * Interroge la boîte mail via IMAP, parse les emails MATERA non traités,
 * et crée automatiquement les charges correspondantes en base.
 */
export async function runMateraChargeSync(): Promise<SyncResult> {
  const result: SyncResult = { processed: 0, created: 0, skipped: 0, errors: [] }

  // Valider que le bien configuré existe réellement en base
  const rawPropertyId = process.env.MATERA_PROPERTY_ID
  let propertyId: number | null = null
  if (rawPropertyId) {
    const parsed = parseInt(rawPropertyId, 10)
    const exists = await Property.findByPk(parsed, { attributes: ['id'] })
    if (exists) {
      propertyId = parsed
    } else {
      console.warn(`[MATERA SYNC] MATERA_PROPERTY_ID=${rawPropertyId} introuvable en base — la charge sera créée sans bien associé.`)
    }
  }

  let emails
  try {
    emails = await fetchMateraEmails()
  } catch (err: any) {
    const msg = `Erreur connexion IMAP : ${err.message}`
    console.error(`[MATERA SYNC] ${msg}`)
    result.errors.push(msg)
    return result
  }

  console.log(`[MATERA SYNC] ${emails.length} email(s) MATERA trouvé(s).`)

  for (const email of emails) {
    result.processed++

    // Vérifier si le Message-ID a déjà été traité
    const alreadyProcessed = await ProcessedEmail.findOne({
      where: { message_id: email.messageId },
    })
    if (alreadyProcessed) {
      result.skipped++
      continue
    }

    // Ignorer silencieusement les emails qui ne sont pas des appels de fonds
    // (invitations, messages privés, rappels, etc.)
    const source = email.text || email.html.replace(/<[^>]+>/g, ' ')
    if (!isFundCallEmail(source)) {
      await ProcessedEmail.create({ message_id: email.messageId, processed_at: new Date() })
      result.skipped++
      continue
    }

    // Parser le corps de l'email
    const parsed = parseMateraEmail(email.text, email.html, email.date)
    if (!parsed) {
      const msg = `Appel de fonds sans montant lisible : email ${email.messageId} (${email.date.toISOString()}).`
      console.warn(`[MATERA SYNC] ${msg}`)
      result.errors.push(msg)
      // Ne PAS marquer comme traité : réessayable après correction des regex
      result.skipped++
      continue
    }

    // Dédup : ne pas créer la charge si elle existe déjà pour ce bien + date + montant
    // (MATERA envoie 2 emails par prélèvement : annonce J-5 et confirmation)
    const existing = await Charge.findOne({
      where: {
        property_id: propertyId,
        date: parsed.date,
        amount: parsed.amount,
        type: 'charges_copro',
      },
    })
    if (existing) {
      console.log(`[MATERA SYNC] Charge déjà existante pour ${parsed.amount} € le ${parsed.date} — email ignoré.`)
      await ProcessedEmail.create({ message_id: email.messageId, processed_at: new Date() })
      result.skipped++
      continue
    }

    // Créer la charge
    try {
      await Charge.create({
        property_id: propertyId,
        type: 'charges_copro',
        description: 'Appel de fonds MATERA (auto)',
        amount: parsed.amount,
        date: parsed.date,
        frequency: 'trimestriel',
      })

      await ProcessedEmail.create({ message_id: email.messageId, processed_at: new Date() })

      console.log(`[MATERA SYNC] Charge créée : ${parsed.amount} € le ${parsed.date}`)
      result.created++
    } catch (err: any) {
      const msg = `Erreur création charge pour email ${email.messageId} : ${err.message}`
      console.error(`[MATERA SYNC] ${msg}`)
      result.errors.push(msg)
    }
  }

  console.log(`[MATERA SYNC] Terminé — créées: ${result.created}, ignorées: ${result.skipped}, erreurs: ${result.errors.length}`)
  return result
}

export interface DebugEmailInfo {
  messageId: string
  date: string
  subject?: string
  textSnippet: string
  htmlSnippet: string
  parseResult: { amount: number; date: string } | null
}

/**
 * Récupère les emails MATERA et retourne leur contenu brut (sans créer de charges).
 * Utile pour calibrer les regex de parsing.
 */
export async function debugMateraEmails(limit = 5): Promise<DebugEmailInfo[]> {
  const emails: RawMateraEmail[] = await fetchMateraEmails()
  return emails.slice(0, limit).map((email) => ({
    messageId: email.messageId,
    date: email.date.toISOString(),
    textSnippet: email.text.slice(0, 2000),
    htmlSnippet: email.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000),
    parseResult: parseMateraEmail(email.text, email.html, email.date),
  }))
}
