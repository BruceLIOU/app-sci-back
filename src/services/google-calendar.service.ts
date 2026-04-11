import { google, calendar_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

const SCOPES = ['https://www.googleapis.com/auth/calendar.events']

function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/visits/google/callback',
  )
}

export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })
}

export async function exchangeCodeForTokens(code: string): Promise<{ access_token: string; refresh_token: string }> {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Tokens manquants dans la réponse Google')
  }
  return { access_token: tokens.access_token, refresh_token: tokens.refresh_token }
}

function buildCalendarClient(refreshToken: string): calendar_v3.Calendar {
  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

function visitToGoogleEvent(visit: {
  title: string
  description?: string | null
  date: string
  time: string
  duration: number
  contact_name?: string | null
  contact_email?: string | null
  notes?: string | null
}): calendar_v3.Schema$Event {
  const startDateTime = `${visit.date}T${visit.time}:00`
  const [hh, mm] = visit.time.split(':').map(Number)
  const totalMin = hh * 60 + mm + visit.duration
  const endHH = String(Math.floor(totalMin / 60) % 24).padStart(2, '0')
  const endMM = String(totalMin % 60).padStart(2, '0')
  const endDateTime = `${visit.date}T${endHH}:${endMM}:00`

  const attendees: calendar_v3.Schema$EventAttendee[] = []
  if (visit.contact_email) {
    attendees.push({ email: visit.contact_email, displayName: visit.contact_name || undefined })
  }

  return {
    summary: visit.title,
    description: [visit.description, visit.notes].filter(Boolean).join('\n\n') || undefined,
    start: { dateTime: startDateTime, timeZone: 'Europe/Paris' },
    end: { dateTime: endDateTime, timeZone: 'Europe/Paris' },
    attendees: attendees.length > 0 ? attendees : undefined,
  }
}

export async function createGoogleEvent(
  refreshToken: string,
  visit: Parameters<typeof visitToGoogleEvent>[0],
): Promise<string> {
  const calendar = buildCalendarClient(refreshToken)
  const event = visitToGoogleEvent(visit)
  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    requestBody: event,
  })
  return response.data.id!
}

export async function updateGoogleEvent(
  refreshToken: string,
  eventId: string,
  visit: Parameters<typeof visitToGoogleEvent>[0],
): Promise<void> {
  const calendar = buildCalendarClient(refreshToken)
  const event = visitToGoogleEvent(visit)
  await calendar.events.update({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    eventId,
    requestBody: event,
  })
}

export async function deleteGoogleEvent(refreshToken: string, eventId: string): Promise<void> {
  const calendar = buildCalendarClient(refreshToken)
  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    eventId,
  })
}
