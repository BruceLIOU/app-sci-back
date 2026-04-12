import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendInvitationEmail(to: string, activationLink: string): Promise<void> {
  const appName = process.env.APP_NAME || 'App SCI'
  await transporter.sendMail({
    from: `"${appName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
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
