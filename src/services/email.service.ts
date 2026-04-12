import nodemailer from 'nodemailer'
import archiver from 'archiver'
import { decrypt } from '../utils/crypto.util'

const db = require('../models')

async function createTransporter() {
  let config: any = null
  try {
    config = await db.OwnerConfig.findOne()
  } catch (_) {}
  const appName = process.env.APP_NAME || 'Pilotage Immo'
  const host = config?.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = config?.smtp_port ?? parseInt(process.env.SMTP_PORT || '587', 10)
  const secure = config?.smtp_secure ?? (process.env.SMTP_SECURE === 'true')
  const user = config?.smtp_user || process.env.SMTP_USER
  const pass = (config?.smtp_pass ? decrypt(config.smtp_pass) : null) || process.env.SMTP_PASS
  const from = config?.smtp_from || process.env.SMTP_FROM || user
  return {
    transport: nodemailer.createTransport({ host, port, secure, auth: { user, pass } }),
    from: `"${appName}" <${from}>`,
  }
}

export async function testSmtpConnection(to: string): Promise<void> {
  const { transport, from } = await createTransporter()
  await transport.verify()
  await transport.sendMail({
    from,
    to,
    subject: 'Test SMTP - Pilotage Immo',
    html: '<p>Connexion SMTP validee avec succes.</p>',
  })
}

export async function sendInvitationEmail(to: string, activationLink: string): Promise<void> {
  const { transport, from } = await createTransporter()
  const appName = process.env.APP_NAME || 'Pilotage Immo'
  await transport.sendMail({
    from,
    to,
    subject: `Invitation à rejoindre ${appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d6a4f;">Vous avez été invité(e) à rejoindre ${appName}</h2>
        <p>Un administrateur vous a invité(e) à accéder à l'application de gestion SCI.</p>
        <p>Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${activationLink}"
             style="background-color: #2d6a4f; color: white; padding: 14px 28px;
                    text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
            Activer mon compte
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Ce lien est valable <strong>24 heures</strong> et ne peut être utilisé qu'une seule fois.
        </p>
        <p style="color: #999; font-size: 12px;">
          Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
        </p>
      </div>
    `,
  })
}

export async function sendPdfByEmail(
  to: string,
  subject: string,
  html: string,
  attachment: { filename: string; content: Buffer },
): Promise<void> {
  const { transport, from } = await createTransporter()
  await transport.sendMail({
    from,
    to,
    subject,
    html,
    attachments: [{ filename: attachment.filename, content: attachment.content, contentType: 'application/pdf' }],
  })
}

export function buildZipBuffer(files: { filename: string; content: Buffer }[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []
    archive.on('data', (chunk: Buffer) => chunks.push(chunk))
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.on('error', reject)
    for (const f of files) {
      archive.append(f.content, { name: f.filename })
    }
    archive.finalize()
  })
}

export async function sendZipByEmail(
  to: string,
  subject: string,
  html: string,
  attachment: { filename: string; content: Buffer },
): Promise<void> {
  const { transport, from } = await createTransporter()
  await transport.sendMail({
    from,
    to,
    subject,
    html,
    attachments: [{ filename: attachment.filename, content: attachment.content, contentType: 'application/zip' }],
  })
}

export async function sendLoginCodeEmail(to: string, loginCode: string, expiresInMinutes: number): Promise<void> {
  const { transport, from } = await createTransporter()
  const appName = process.env.APP_NAME || 'Pilotage Immo'
  await transport.sendMail({
    from,
    to,
    subject: `Votre code de connexion - ${appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d6a4f;">Connexion à ${appName}</h2>
        <p>Vous avez demandé un code de connexion. Saisissez ce code dans l'application pour accéder à votre compte :</p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; background: #f3f7f4; border: 1px solid #d8e5db; border-radius: 12px; padding: 18px 24px;">
            <div style="font-size: 28px; letter-spacing: 0.35em; font-weight: bold; color: #1f5138; font-family: 'Courier New', monospace; margin-left: 0.35em;">
              ${loginCode}
            </div>
          </div>
        </div>
        <p style="color: #666; font-size: 14px;">
          Ce code est valable <strong>${expiresInMinutes} minutes</strong> et ne peut être utilisé qu'une seule fois.
        </p>
        <p style="color: #999; font-size: 12px;">
          Si vous n'avez pas demandé ce code, ignorez cet email.
        </p>
      </div>
    `,
  })
}
