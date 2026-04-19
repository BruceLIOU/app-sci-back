import type { Request, Response } from "express";
const db = require("../models");
const { Maintenance, Property, Tenant } = db;

const include = [
	{ model: Property, attributes: ["id", "type", "address", "city"] },
	{ model: Tenant, attributes: ["id", "civility", "firstname", "lastname"] },
];

exports.findAll = async (_req: Request, res: Response) => {
	try {
		const data = await Maintenance.findAll({
			include,
			order: [["createdAt", "DESC"]],
		});
		res.status(200).json(data);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.findOne = async (req: Request, res: Response) => {
	try {
		const data = await Maintenance.findByPk(req.params.id, { include });
		if (!data)
			return res.status(404).json({ message: "Intervention introuvable." });
		res.status(200).json(data);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.create = async (req: Request, res: Response) => {
	const fields = req.fields as Record<string, any>;
	const {
		property_id,
		title,
		type,
		priority,
		status,
		description,
		tenant_id,
		reported_at,
		provider_name,
		provider_phone,
		estimated_cost,
		actual_cost,
		resolved_at,
		notes,
	} = fields;
	if (!property_id || !title)
		return res
			.status(400)
			.json({ message: "Le bien et le titre sont obligatoires." });
	try {
		const item = await Maintenance.create({
			property_id,
			tenant_id: tenant_id || null,
			title,
			description: description || null,
			type: type || "autre",
			priority: priority || "medium",
			status: status || "open",
			reported_at: reported_at || null,
			resolved_at: resolved_at || null,
			provider_name: provider_name || null,
			provider_phone: provider_phone || null,
			estimated_cost: estimated_cost || null,
			actual_cost: actual_cost || null,
			notes: notes || null,
		});
		res.status(201).json(item);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.update = async (req: Request, res: Response) => {
	const fields = req.fields as Record<string, any>;
	const {
		property_id,
		title,
		type,
		priority,
		status,
		description,
		tenant_id,
		reported_at,
		provider_name,
		provider_phone,
		estimated_cost,
		actual_cost,
		resolved_at,
		notes,
	} = fields;
	try {
		const [num] = await Maintenance.update(
			{
				property_id,
				tenant_id: tenant_id || null,
				title,
				description: description || null,
				type,
				priority,
				status,
				reported_at: reported_at || null,
				resolved_at: resolved_at || null,
				provider_name: provider_name || null,
				provider_phone: provider_phone || null,
				estimated_cost: estimated_cost || null,
				actual_cost: actual_cost || null,
				notes: notes || null,
			},
			{ where: { id: req.params.id } },
		);
		if (num > 0)
			return res.status(200).json({ message: "Intervention mise à jour." });
		res.status(404).json({ message: "Intervention introuvable." });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.delete = async (req: Request, res: Response) => {
	try {
		const num = await Maintenance.destroy({ where: { id: req.params.id } });
		if (num === 1)
			return res
				.status(200)
				.json({ message: "Intervention supprimée.", isDeleted: true });
		res
			.status(404)
			.json({ message: "Intervention introuvable.", isDeleted: false });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};
