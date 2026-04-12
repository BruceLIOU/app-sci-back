import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import jwt from 'jsonwebtoken'

let wss: WebSocketServer | null = null

function parseCookies(cookieHeader: string): Record<string, string> {
  const out: Record<string, string> = {}
  cookieHeader.split(';').forEach((part) => {
    const eq = part.indexOf('=')
    if (eq < 0) return
    const key = part.slice(0, eq).trim()
    const val = part.slice(eq + 1).trim()
    out[key] = decodeURIComponent(val)
  })
  return out
}

export function initWss(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws: WebSocket, req) => {
    const cookies = parseCookies(req.headers.cookie || '')
    const token = cookies['sci_token']
    if (!token) {
      ws.close(1008, 'Unauthorized')
      return
    }
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret')
    } catch {
      ws.close(1008, 'Unauthorized')
      return
    }

    ;(ws as any).isAlive = true
    ws.on('pong', () => { (ws as any).isAlive = true })
  })

  // Heartbeat : ferme les connexions mortes toutes les 30s
  const heartbeat = setInterval(() => {
    wss!.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) {
        ws.terminate()
        return
      }
      ;(ws as any).isAlive = false
      ws.ping()
    })
  }, 30_000)

  wss.on('close', () => clearInterval(heartbeat))

  console.log('🟢 WebSocket server started on /ws')
}

export function broadcastNotification(notification: Record<string, any>): void {
  if (!wss) return
  const payload = JSON.stringify({ type: 'notification', data: notification })
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
}
