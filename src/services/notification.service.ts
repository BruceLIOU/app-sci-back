const db = require('../models')

export interface NotificationData {
  type: 'matera_charge' | 'email_sent'
  title: string
  message?: string
  metadata?: Record<string, any>
}

/**
 * Crée une notification en base (échoue silencieusement pour ne pas bloquer le flux principal).
 */
export async function createNotification(data: NotificationData): Promise<void> {
  try {
    await db.Notification.create({
      type: data.type,
      title: data.title,
      message: data.message ?? null,
      is_read: false,
      metadata: data.metadata ?? null,
    })
  } catch (err: any) {
    console.error('[NOTIFICATION] Erreur création notification :', err.message)
  }
}
