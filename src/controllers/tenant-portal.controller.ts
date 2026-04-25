import type { Request, Response } from "express";
import { createNotification } from "../services/notification.service";

const db = require("../models");

function getTenantId(req: Request): number | null {
	return (req as any).user?.tenant_id ?? null;
}

// GET /api/tenant-portal/dashboard
exports.getDashboard = async (req: Request, res: Response) => {
	const tenantId = getTenantId(req);
	if (!tenantId)
		return res
			.status(403)
			.json({ message: "Aucun locataire associé à ce compte." });

	try {
		const tenant = await db.Tenant.findByPk(tenantId, {
			include: [{ model: db.Property, attributes: ["id", "address", "city"] }],
		});
		if (!tenant)
			return res.status(404).json({ message: "Locataire introuvable." });

		const activeLease = await db.Lease.findOne({
			where: { tenant_id: tenantId, status: "active" },
			attributes: [
				"id",
				"start_date",
				"end_date",
				"rent_amount",
				"charges_amount",
				"status",
			],
		});

		const pendingPayments = await db.Payment.count({
			where: { tenant_id: tenantId, status: ["pending", "late"] },
		});

		res.json({ tenant, activeLease, pendingPayments });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

// GET /api/tenant-portal/payments
exports.getPayments = async (req: Request, res: Response) => {
	const tenantId = getTenantId(req);
	if (!tenantId)
		return res
			.status(403)
			.json({ message: "Aucun locataire associé à ce compte." });

	try {
		const payments = await db.Payment.findAll({
			where: { tenant_id: tenantId },
			order: [["due_date", "DESC"]],
			attributes: ["id", "amount", "due_date", "paid_date", "status", "month"],
			include: [{ model: db.Property, attributes: ["id", "address"] }],
		});
		res.json(payments);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

// GET /api/tenant-portal/documents
exports.getDocuments = async (req: Request, res: Response) => {
	const tenantId = getTenantId(req);
	if (!tenantId)
		return res
			.status(403)
			.json({ message: "Aucun locataire associé à ce compte." });

	try {
		const documents = await db.Document.findAll({
			where: { entity_type: "tenant", entity_id: tenantId },
			order: [["createdAt", "DESC"]],
			attributes: [
				"id",
				"title",
				"category",
				"file_url",
				"file_name",
				"file_size",
				"mime_type",
				"createdAt",
			],
		});
		res.json(documents);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

// GET /api/tenant-portal/maintenance
exports.getMaintenance = async (req: Request, res: Response) => {
	const tenantId = getTenantId(req);
	if (!tenantId)
		return res
			.status(403)
			.json({ message: "Aucun locataire associé à ce compte." });

	try {
		const items = await db.Maintenance.findAll({
			where: { tenant_id: tenantId },
			order: [["createdAt", "DESC"]],
			attributes: [
				"id",
				"title",
				"description",
				"type",
				"priority",
				"status",
				"reported_at",
				"createdAt",
			],
			include: [{ model: db.Property, attributes: ["id", "address"] }],
		});
		res.json(items);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

// POST /api/tenant-portal/maintenance
exports.createMaintenance = async (req: Request, res: Response) => {
	const tenantId = getTenantId(req);
	if (!tenantId)
		return res
			.status(403)
			.json({ message: "Aucun locataire associé à ce compte." });

	const f = (req as any).fields || {};
	const { title, description, type } = f;

	if (!title) return res.status(400).json({ message: "Le titre est requis." });

	try {
		const tenant = await db.Tenant.findByPk(tenantId, {
			attributes: ["id", "property_id"],
		});
		if (!tenant)
			return res.status(404).json({ message: "Locataire introuvable." });

		const item = await db.Maintenance.create({
			property_id: tenant.property_id,
			tenant_id: tenantId,
			title,
			description: description || null,
			type: type || "autre",
			priority: "medium",
			status: "open",
			reported_at: new Date().toISOString().slice(0, 10),
		});

		await createNotification({
			type: "maintenance_report",
			title: "Nouveau signalement locataire",
			message: title as string,
			metadata: {
				maintenance_id: item.id,
				tenant_id: tenantId,
				property_id: tenant.property_id,
			},
		});

		res.status(201).json(item);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};
