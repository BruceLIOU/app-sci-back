const db = require("../models");
import { broadcastNotification } from "./ws.service";

export interface NotificationData {
	type:
		| "matera_charge"
		| "email_sent"
		| "lease_expiry"
		| "payment_reminder"
		| "lease_renewal"
		| "lease_termination";
	title: string;
	message?: string;
	metadata?: Record<string, any>;
}

/**
 * Crée une notification en base et la diffuse en temps réel via WebSocket.
 */
export async function createNotification(
	data: NotificationData,
): Promise<void> {
	try {
		const notif = await db.Notification.create({
			type: data.type,
			title: data.title,
			message: data.message ?? null,
			is_read: false,
			metadata: data.metadata ?? null,
		});
		broadcastNotification(notif.toJSON());
	} catch (err: any) {
		console.error("[NOTIFICATION] Erreur création notification :", err.message);
	}
}
