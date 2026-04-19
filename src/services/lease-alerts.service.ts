import { interpolateTemplate } from "../utils/template.util";
import { sendPdfByEmail } from "./email.service";
import { createNotification } from "./notification.service";

const db = require("../models");

// Notify at exactly 90 and 30 days (checked daily — window of ±1 day)
const ALERT_THRESHOLDS = [90, 30];

export async function checkLeaseExpiries(): Promise<void> {
	const now = new Date();

	let leases: any[] = [];
	try {
		leases = await db.Lease.findAll({
			where: { status: "active" },
			include: [
				{ model: db.Property, attributes: ["address", "city"] },
				{
					model: db.Tenant,
					attributes: ["civility", "firstname", "lastname", "email"],
				},
			],
		});
	} catch (err: any) {
		console.error("[LEASE ALERTS] Erreur lecture baux :", err.message);
		return;
	}

	for (const lease of leases) {
		if (!lease.end_date) continue;
		const daysLeft = Math.ceil(
			(new Date(lease.end_date).getTime() - now.getTime()) / 86400000,
		);

		for (const threshold of ALERT_THRESHOLDS) {
			if (daysLeft >= threshold - 1 && daysLeft <= threshold + 1) {
				const address = lease.Property?.address
					? `${lease.Property.address}, ${lease.Property.city}`
					: `Bail #${lease.id}`;
				const tenant = lease.Tenant
					? `${lease.Tenant.firstname} ${lease.Tenant.lastname}`
					: "Locataire inconnu";

				await createNotification({
					type: "lease_expiry",
					title: `Bail expirant dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
					message: `${address} — ${tenant}`,
					metadata: {
						lease_id: lease.id,
						days_left: daysLeft,
						end_date: lease.end_date,
					},
				});

				// Send email to owner if SMTP is configured
				try {
					const config = await db.OwnerConfig.findOne();
					const ownerEmail = config?.smtp_from || config?.smtp_user;
					if (ownerEmail) {
						const vars = {
							civilite: lease.Tenant?.civility || "",
							nom_locataire: tenant,
							bien: address,
							date_fin_bail: lease.end_date || "",
							jours_retard: String(daysLeft),
						};
						const defaultBody = `<p>Le bail pour le bien <strong>${address}</strong> (locataire : ${tenant}) expire dans <strong>${daysLeft} jours</strong> (le ${lease.end_date}).</p><p>Pensez à anticiper le renouvellement ou la résiliation.</p>`;
						const body = config?.email_template_lease_expiry
							? interpolateTemplate(config.email_template_lease_expiry, vars)
							: defaultBody;
						await sendPdfByEmail(
							ownerEmail,
							`Bail expirant dans ${daysLeft} jours — ${address}`,
							body,
							{ filename: "", content: Buffer.from("") },
						);
					}
				} catch (_) {}

				break; // Only one notification per threshold
			}
		}
	}

	console.log(
		`[LEASE ALERTS] Vérification terminée — ${leases.length} bail(x) analysé(s)`,
	);
}
