import cron, { type ScheduledTask } from "node-cron";
import { runMateraChargeSync } from "./charge-automation.service";
import { checkLeaseExpiries } from "./lease-alerts.service";
import { sendPaymentReminders } from "./payment-reminders.service";

let materaCronTask: ScheduledTask | null = null;
let dailyAlertsCronTask: ScheduledTask | null = null;

export function startCron(schedule: string, enabled = true): void {
	if (materaCronTask) {
		materaCronTask.stop();
		materaCronTask = null;
	}
	if (!enabled || !schedule) return;
	if (!cron.validate(schedule)) {
		console.error(`[CRON] Schedule invalide : "${schedule}"`);
		return;
	}
	materaCronTask = cron.schedule(schedule, () => {
		console.log("[MATERA SYNC] Déclenchement cron...");
		runMateraChargeSync().catch((err: Error) =>
			console.error("[MATERA SYNC] Erreur inattendue :", err.message),
		);
	});
	console.log(
		`🕐 Cron MATERA démarré (schedule: "${schedule}", activé: ${enabled})`,
	);
}

export function startDailyAlerts(enabled = true): void {
	if (dailyAlertsCronTask) return;
	if (!enabled) return;

	// Daily at 8:30am — lease expiry alerts and payment reminders
	dailyAlertsCronTask = cron.schedule("30 8 * * *", () => {
		console.log("[DAILY ALERTS] Vérification des alertes...");
		checkLeaseExpiries().catch((err: Error) =>
			console.error("[LEASE ALERTS] Erreur :", err.message),
		);
		sendPaymentReminders().catch((err: Error) =>
			console.error("[PAYMENT REMINDERS] Erreur :", err.message),
		);
	});
	console.log(
		`🕐 Cron alertes quotidiennes démarré (8h30, activé: ${enabled})`,
	);
}

export function reloadDailyAlerts(enabled: boolean): void {
	if (dailyAlertsCronTask) {
		dailyAlertsCronTask.stop();
		dailyAlertsCronTask = null;
	}
	if (enabled) startDailyAlerts(true);
	else console.log("🛑 Cron alertes quotidiennes désactivé");
}

export function stopCron(): void {
	if (materaCronTask) {
		materaCronTask.stop();
		materaCronTask = null;
		console.log("🛑 Cron MATERA arrêté");
	}
	if (dailyAlertsCronTask) {
		dailyAlertsCronTask.stop();
		dailyAlertsCronTask = null;
		console.log("🛑 Cron alertes quotidiennes arrêté");
	}
}
