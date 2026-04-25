import type { Request, Response } from "express";
import cloudinary from "../config/cloudinary.config";
import {
	sendLeaseRenewalEmail,
	sendLeaseTerminationEmail,
} from "../services/email.service";
import { calculateIrlRevision, fetchLatestIrl } from "../services/irl.service";
import { createNotification } from "../services/notification.service";
const db = require("../models");
const { Lease, Property, Tenant } = db;
const Document = db.Document;

const MOIS_FR = [
	"Janvier",
	"Février",
	"Mars",
	"Avril",
	"Mai",
	"Juin",
	"Juillet",
	"Août",
	"Septembre",
	"Octobre",
	"Novembre",
	"Décembre",
];

async function schedulePaymentsFrom(
	lease: any,
	fromDate: string | null,
	toDate: string,
	t: any,
) {
	const refStart = new Date(lease.start_date);
	const day = refStart.getDate();
	// Start from the month after fromDate (avoids duplicating existing payments)
	const pivotDate = fromDate ? new Date(fromDate) : refStart;
	const scheduleStart = new Date(
		pivotDate.getFullYear(),
		pivotDate.getMonth() + 1,
		1,
	);
	const endDate = new Date(toDate);

	const rentAmount = Number.parseFloat(lease.rent_amount);
	const chargesAmount = Number.parseFloat(lease.charges_amount || 0);
	const amount = (rentAmount + chargesAmount).toFixed(2);

	const toCreate: Promise<any>[] = [];
	const cur = new Date(
		scheduleStart.getFullYear(),
		scheduleStart.getMonth(),
		1,
	);
	const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

	while (cur <= last) {
		const y = cur.getFullYear();
		const m = cur.getMonth();
		const daysInMonth = new Date(y, m + 1, 0).getDate();
		const dueDay = String(Math.min(day, daysInMonth)).padStart(2, "0");
		const due_date = `${y}-${String(m + 1).padStart(2, "0")}-${dueDay}`;
		toCreate.push(
			db.Payment.create(
				{
					tenant_id: lease.tenant_id || null,
					property_id: lease.property_id || null,
					lease_id: lease.id,
					amount,
					charges_amount: chargesAmount.toFixed(2),
					due_date,
					month: `${MOIS_FR[m]} ${y}`,
					status: "pending",
				},
				{ transaction: t },
			),
		);
		cur.setMonth(m + 1);
	}
	await Promise.all(toCreate);
}

async function schedulePayments(lease: any, t: any) {
	const startDate = new Date(lease.start_date);
	const day = startDate.getDate();

	// Si pas de date de fin : planifier 12 mois (le mois de début inclus)
	const endDate = lease.end_date
		? new Date(lease.end_date)
		: new Date(
				startDate.getFullYear(),
				startDate.getMonth() + 11,
				startDate.getDate(),
			);

	const rentAmount = Number.parseFloat(lease.rent_amount);
	const chargesAmount = Number.parseFloat(lease.charges_amount || 0);
	const amount = (rentAmount + chargesAmount).toFixed(2);

	const toCreate: Promise<any>[] = [];
	const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
	const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

	while (cur <= last) {
		const y = cur.getFullYear();
		const m = cur.getMonth();
		const daysInMonth = new Date(y, m + 1, 0).getDate();
		const dueDay = String(Math.min(day, daysInMonth)).padStart(2, "0");
		const due_date = `${y}-${String(m + 1).padStart(2, "0")}-${dueDay}`;

		toCreate.push(
			db.Payment.create(
				{
					tenant_id: lease.tenant_id || null,
					property_id: lease.property_id || null,
					lease_id: lease.id,
					amount,
					charges_amount: chargesAmount.toFixed(2),
					due_date,
					month: `${MOIS_FR[m]} ${y}`,
					status: "pending",
				},
				{ transaction: t },
			),
		);
		cur.setMonth(m + 1);
	}

	await Promise.all(toCreate);
}

const getPublicId = (url: string): string => {
	const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
	return match ? match[1] : "";
};

async function deleteEntityDocuments(entity_type: string, entity_id: number) {
	const docs = await Document.findAll({ where: { entity_type, entity_id } });
	await Promise.allSettled(
		docs.map((d: any) =>
			cloudinary.uploader.destroy(getPublicId(d.file_url), {
				resource_type: "raw",
			}),
		),
	);
	await Document.destroy({ where: { entity_type, entity_id } });
}

const include = [
	{ model: Property, attributes: ["id", "type", "city", "address", "zipcode"] },
	{
		model: Tenant,
		attributes: ["id", "civility", "firstname", "lastname", "email", "mobile"],
	},
];

exports.create = async (req: Request, res: Response) => {
	const {
		property_id,
		tenant_id,
		type,
		start_date,
		end_date,
		rent_amount,
		charges_amount,
		deposit_amount,
		notice_period,
		status,
		notes,
	} = req.fields;
	if (!property_id || !start_date || !rent_amount)
		return res
			.status(400)
			.json({ message: "Bien, date de début et loyer obligatoires." });
	try {
		const result = await db.sequelize.transaction(async (t: any) => {
			const lease = await Lease.create(
				{
					property_id,
					tenant_id: tenant_id || null,
					type,
					start_date,
					end_date: end_date || null,
					rent_amount,
					charges_amount: charges_amount || 0,
					deposit_amount: deposit_amount || 0,
					notice_period: notice_period || 3,
					status: status || "active",
					notes: notes || null,
				},
				{ transaction: t },
			);
			await schedulePayments(lease, t);
			return lease;
		});
		res.status(201).json(result);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.findAll = async (_req: Request, res: Response) => {
	try {
		const data = await Lease.findAll({
			include,
			order: [["start_date", "DESC"]],
		});
		res.status(200).json(data);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.findOne = async (req: Request, res: Response) => {
	try {
		const data = await Lease.findByPk(req.params.id, { include });
		if (!data) return res.status(404).json({ message: "Bail introuvable." });
		res.status(200).json(data);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.update = async (req: Request, res: Response) => {
	const {
		property_id,
		tenant_id,
		type,
		start_date,
		end_date,
		rent_amount,
		charges_amount,
		deposit_amount,
		notice_period,
		status,
		notes,
	} = req.fields;
	try {
		const [num] = await Lease.update(
			{
				property_id,
				tenant_id: tenant_id || null,
				type,
				start_date,
				end_date: end_date || null,
				rent_amount,
				charges_amount: charges_amount || 0,
				deposit_amount: deposit_amount || 0,
				notice_period,
				status,
				notes: notes || null,
			},
			{ where: { id: req.params.id } },
		);
		if (num > 0) return res.status(200).json({ message: "Bail mis à jour." });
		res.status(404).json({ message: "Bail introuvable." });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.getIrl = async (_req: Request, res: Response) => {
	try {
		const irl = await fetchLatestIrl();
		res.status(200).json(irl);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.simulateIrl = async (req: Request, res: Response) => {
	const { lease_id } = req.params;
	try {
		const lease = await Lease.findByPk(lease_id);
		if (!lease) return res.status(404).json({ message: "Bail introuvable." });
		const referenceIrl = lease.irl_reference || 130; // fallback to a reasonable base
		const currentRent = Number.parseFloat(lease.rent_amount);
		const result = await calculateIrlRevision(currentRent, referenceIrl);
		res.status(200).json({
			lease_id: lease.id,
			current_rent: currentRent,
			reference_irl: referenceIrl,
			new_rent: result.newRent,
			current_irl: result.currentIrl,
			variation_pct: (result.variation * 100).toFixed(2),
		});
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.applyIrl = async (req: Request, res: Response) => {
	const { lease_id } = req.params;
	try {
		const lease = await Lease.findByPk(lease_id, { include });
		if (!lease) return res.status(404).json({ message: "Bail introuvable." });
		const referenceIrl = lease.irl_reference || 130;
		const currentRent = Number.parseFloat(lease.rent_amount);
		const { newRent, currentIrl } = await calculateIrlRevision(
			currentRent,
			referenceIrl,
		);
		await lease.update({
			rent_amount: newRent,
			irl_reference: currentIrl.value,
			last_irl_revision: new Date().toISOString().slice(0, 10),
		});
		res.status(200).json({
			message: "Loyer mis à jour.",
			old_rent: currentRent,
			new_rent: newRent,
			irl: currentIrl,
		});
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.renew = async (req: Request, res: Response) => {
	const { lease_id } = req.params;
	const new_end_date = req.fields?.new_end_date as string;
	if (!new_end_date)
		return res
			.status(400)
			.json({ message: "Nouvelle date de fin obligatoire." });
	try {
		const lease = await Lease.findByPk(lease_id, { include });
		if (!lease) return res.status(404).json({ message: "Bail introuvable." });
		if (lease.status !== "active")
			return res
				.status(400)
				.json({ message: "Seul un bail actif peut être renouvelé." });

		const oldEndDate = lease.end_date as string | null;
		await db.sequelize.transaction(async (t: any) => {
			await lease.update({ end_date: new_end_date }, { transaction: t });
			await schedulePaymentsFrom(lease, oldEndDate, new_end_date, t);
		});

		if (lease.Tenant?.email) {
			const name =
				`${lease.Tenant.civility || ""} ${lease.Tenant.firstname} ${lease.Tenant.lastname}`.trim();
			const addr = `${lease.Property?.type || ""} - ${lease.Property?.address || ""}, ${lease.Property?.city || ""}`;
			sendLeaseRenewalEmail(
				lease.Tenant.email,
				name,
				addr,
				oldEndDate || "",
				new_end_date,
			).catch(() => {});
		}

		await createNotification({
			type: "lease_renewal",
			title: "Bail renouvelé",
			message: `Bail ${lease.Property?.city || ""} renouvelé jusqu'au ${new_end_date}`,
			metadata: { lease_id: lease.id },
		});

		res
			.status(200)
			.json({ message: "Bail renouvelé avec succès.", new_end_date });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.terminate = async (req: Request, res: Response) => {
	const { lease_id } = req.params;
	const termination_date =
		(req.fields?.termination_date as string) ||
		new Date().toISOString().slice(0, 10);
	const reason = (req.fields?.reason as string) || undefined;
	try {
		const lease = await Lease.findByPk(lease_id, { include });
		if (!lease) return res.status(404).json({ message: "Bail introuvable." });
		if (lease.status !== "active")
			return res
				.status(400)
				.json({ message: "Seul un bail actif peut être résilié." });

		await lease.update({ status: "terminated", end_date: termination_date });

		if (lease.Tenant?.email) {
			const name =
				`${lease.Tenant.civility || ""} ${lease.Tenant.firstname} ${lease.Tenant.lastname}`.trim();
			const addr = `${lease.Property?.type || ""} - ${lease.Property?.address || ""}, ${lease.Property?.city || ""}`;
			sendLeaseTerminationEmail(
				lease.Tenant.email,
				name,
				addr,
				termination_date,
				reason,
			).catch(() => {});
		}

		await createNotification({
			type: "lease_termination",
			title: "Bail résilié",
			message: `Bail ${lease.Property?.city || ""} résilié le ${termination_date}`,
			metadata: { lease_id: lease.id },
		});

		res.status(200).json({ message: "Bail résilié.", termination_date });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.delete = async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	try {
		await deleteEntityDocuments("lease", id);
		const num = await Lease.destroy({ where: { id } });
		if (num === 1)
			return res
				.status(200)
				.json({ message: "Bail supprimé.", isDeleted: true });
		res.status(404).json({ message: "Bail introuvable.", isDeleted: false });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};
