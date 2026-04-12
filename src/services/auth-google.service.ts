import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

const SCOPES = ['openid', 'profile', 'email']

function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_AUTH_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
  )
}

export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'online',
    scope: SCOPES,
    prompt: 'select_account',
  })
}

export async function getUserProfile(code: string): Promise<{
  google_id: string
  email: string
  name: string
  avatar: string | null
}> {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const { data } = await oauth2.userinfo.get()

  if (!data.id || !data.email) throw new Error('Profil Google incomplet.')

  return {
    google_id: data.id,
    email: data.email,
    name: data.name || data.email,
    avatar: data.picture || null,
  }
}
