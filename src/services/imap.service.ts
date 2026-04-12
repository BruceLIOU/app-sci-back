import imapSimple, { ImapSimple, Message } from 'imap-simple'
import { simpleParser, ParsedMail } from 'mailparser'

export interface RawMateraEmail {
  messageId: string
  text: string
  html: string
  date: Date
}

export async function fetchMateraEmails(): Promise<RawMateraEmail[]> {
  const senderEmail = process.env.MATERA_SENDER_EMAIL
  if (!senderEmail) throw new Error('MATERA_SENDER_EMAIL non défini dans .env')

  const config = {
    imap: {
      host: process.env.IMAP_HOST || '',
      port: parseInt(process.env.IMAP_PORT || '993', 10),
      tls: process.env.IMAP_TLS !== 'false',
      user: process.env.IMAP_USER || '',
      password: process.env.IMAP_PASS || '',
      authTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false },
    },
  }

  let connection: ImapSimple | null = null
  try {
    connection = await imapSimple.connect(config)
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
