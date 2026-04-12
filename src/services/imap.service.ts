import imapSimple, { ImapSimple, Message } from 'imap-simple'
import { simpleParser, ParsedMail } from 'mailparser'
import { decrypt } from '../utils/crypto.util'

const db = require('../models')

export interface RawMateraEmail {
  messageId: string
  text: string
  html: string
  date: Date
}

export async function fetchMateraEmails(): Promise<RawMateraEmail[]> {
  let ownerConfig: any = null
  try {
    ownerConfig = await db.OwnerConfig.findOne()
  } catch (_) {}

  const senderEmail = ownerConfig?.matera_sender_email || process.env.MATERA_SENDER_EMAIL
  if (!senderEmail) throw new Error('MATERA_SENDER_EMAIL non configuré')

  const imapConfig = {
    imap: {
      host: ownerConfig?.imap_host || process.env.IMAP_HOST || '',
      port: ownerConfig?.imap_port ?? parseInt(process.env.IMAP_PORT || '993', 10),
      tls: ownerConfig?.imap_tls ?? (process.env.IMAP_TLS !== 'false'),
      user: ownerConfig?.imap_user || process.env.IMAP_USER || '',
      password: (ownerConfig?.imap_pass ? decrypt(ownerConfig.imap_pass) : null) || process.env.IMAP_PASS || '',
      authTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false },
    },
  }

  let connection: ImapSimple | null = null
  try {
    connection = await imapSimple.connect(imapConfig)
    await connection.openBox('INBOX')

    const searchCriteria = [['FROM', senderEmail]]
    const fetchOptions = { bodies: [''], struct: true }
    const messages: Message[] = await connection.search(searchCriteria, fetchOptions)

    const results: RawMateraEmail[] = []

    for (const message of messages) {
      const part = message.parts.find((p) => p.which === '')
      if (!part) continue

      const parsed: ParsedMail = await simpleParser(part.body as string)
      const messageId = parsed.messageId || ''
      if (!messageId) continue

      results.push({
        messageId,
        text: parsed.text || '',
        html: typeof parsed.html === 'string' ? parsed.html : '',
        date: parsed.date || new Date(),
      })
    }

    return results
  } finally {
    connection?.end()
  }
}

