import { interpolateTemplate } from "../utils/template.util";
import { sendPdfByEmail } from "./email.service";
import { createNotification } from "./notification.service";

const db = require("../models");

// Reminders sent at J+5, J+15, J+30 after due date
const REMINDER_DAYS = [5, 15, 30];

export async function sendPaymentReminders(): Promise<void> {
	const now = new Date();

	let payments: any[] = [];
	try {
		payments = await db.Payment.findAll({
			where: { status: ["pending", "late"] },
			include: [
				{
					model: db.Tenant,
					attributes: ["civility", "firstname", "lastname", "email"],
				},
				{ model: db.Property, attributes: ["address", "city"] },
			],
		});
	} catch (err: any) {
		console.error(
			"[PAYMENT REMINDERS] Erreur lecture paiements :",
			err.message,
		);
		return;
	}

	let reminded = 0;
	for (const payment of payments) {
		if (!payment.due_date) continue;
		const dueDate = new Date(payment.due_date);
		const daysLate = Math.floor((now.getTime() - dueDate.getTime()) / 86400000);
		if (daysLate <= 0) continue;

		for (const threshold of REMINDER_DAYS) {
			if (daysLate >= threshold - 1 && daysLate <= threshold + 1) {
				const tenant = payment.Tenant
					? `${payment.Tenant.firstname} ${payment.Tenant.lastname}`
					: "Locataire inconnu";
				const address = payment.Property?.address
					? `${payment.Property.address}, ${payment.Property.city}`
					: `Bien #${payment.property_id}`;
				const amount = Number.parseFloat(payment.amount || 0).toFixed(2);

				// Notification interne
				await createNotification({
					type: "payment_reminder",
					title: `Impayé — ${tenant} (J+${daysLate})`,
					message: `${address} — ${amount} € dû depuis le ${payment.due_date}`,
					metadata: {
						payment_id: payment.id,
						days_late: daysLate,
						amount: payment.amount,
					},
				});

				// Email de relance au locataire
				if (payment.Tenant?.email) {
					try {
						const config = await db.OwnerConfig.findOne();
						const vars = {
							civilite: payment.Tenant?.civility || "",
							nom_locataire: tenant,
							montant: amount,
							mois: payment.month || payment.due_date || "",
							bien: address,
							date_echeance: payment.due_date || "",
							jours_retard: String(daysLate),
						};
						const defaultBody = `<p>Bonjour ${payment.Tenant.firstname},</p><p>Nous vous rappelons que votre loyer de <strong>${amount} €</strong> pour le bien <strong>${address}</strong> était dû le <strong>${payment.due_date}</strong> et n'a pas encore été réglé.</p><p>Merci de procéder au règlement dans les meilleurs délais.</p>`;
						const body = config?.email_template_payment_reminder
							? interpolateTemplate(
									config.email_template_payment_reminder,
									vars,
								)
							: defaultBody;
						await sendPdfByEmail(
							payment.Tenant.email,
							`Rappel de paiement — Loyer du ${payment.month || payment.due_date}`,
							body,
							{ filename: "", content: Buffer.from("") },
						);
					} catch (_) {}
				}

				reminded++;
				break;
			}
		}
	}

	console.log(
		`[PAYMENT REMINDERS] ${reminded} relance(s) envoyée(s) sur ${payments.length} impayé(s)`,
	);
}
