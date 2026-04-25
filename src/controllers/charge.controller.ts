import type { Request, Response } from "express";
import {
	debugMateraEmails,
	runMateraChargeSync,
} from "../services/charge-automation.service";
const db = require("../models");
const { Charge, Property } = db;

const include = [
	{ model: Property, attributes: ["id", "type", "city", "address"] },
];

exports.create = async (req: Request, res: Response) => {
	const { property_id, type, description, amount, date, frequency, tva_rate } =
		req.fields;
	if (!amount || !date)
		return res.status(400).json({ message: "Montant et date obligatoires." });
	try {
		const result = await Charge.create({
			property_id: property_id || null,
			type: type || "autre",
			description,
			amount,
			date,
			frequency: frequency || "unique",
			tva_rate: tva_rate || null,
		});
		res.status(201).json(result);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.findAll = async (_req: Request, res: Response) => {
	try {
		const data = await Charge.findAll({ include, order: [["date", "DESC"]] });
		res.status(200).json(data);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.findOne = async (req: Request, res: Response) => {
	try {
		const data = await Charge.findByPk(req.params.id, { include });
		if (!data) return res.status(404).json({ message: "Charge introuvable." });
		res.status(200).json(data);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.update = async (req: Request, res: Response) => {
	const { property_id, type, description, amount, date, frequency, tva_rate } =
		req.fields;
	try {
		const [num] = await Charge.update(
			{
				property_id: property_id || null,
				type,
				description,
				amount,
				date,
				frequency,
				tva_rate: tva_rate || null,
			},
			{ where: { id: req.params.id } },
		);
		if (num > 0)
			return res.status(200).json({ message: "Charge mise à jour." });
		res.status(404).json({ message: "Charge introuvable." });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.delete = async (req: Request, res: Response) => {
	try {
		const num = await Charge.destroy({ where: { id: req.params.id } });
		if (num === 1)
			return res
				.status(200)
				.json({ message: "Charge supprimée.", isDeleted: true });
		res.status(404).json({ message: "Charge introuvable.", isDeleted: false });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.bulkDelete = async (req: Request, res: Response) => {
	try {
		const ids: number[] = JSON.parse((req.fields?.ids as string) || "[]");
		if (!ids.length)
			return res.status(400).json({ message: "Aucun identifiant fourni." });
		const num = await Charge.destroy({ where: { id: ids } });
		res
			.status(200)
			.json({ message: `${num} charge(s) supprimée(s).`, deleted: num });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.syncMatera = async (_req: Request, res: Response) => {
	try {
		const result = await runMateraChargeSync();
		res.status(200).json(result);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.debugMatera = async (req: Request, res: Response) => {
	try {
		const limit = Number.parseInt((req.query.limit as string) || "5", 10);
		const emails = await debugMateraEmails(limit);
		res.status(200).json(emails);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};
