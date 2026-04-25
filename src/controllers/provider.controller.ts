import type { Request, Response } from "express";
const db = require("../models");
const { Provider } = db;

exports.findAll = async (_req: Request, res: Response) => {
	try {
		const data = await Provider.findAll({ order: [["name", "ASC"]] });
		res.status(200).json(data);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.findOne = async (req: Request, res: Response) => {
	try {
		const data = await Provider.findByPk(req.params.id);
		if (!data)
			return res.status(404).json({ message: "Prestataire introuvable." });
		res.status(200).json(data);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.create = async (req: Request, res: Response) => {
	const fields = req.fields as Record<string, any>;
	const {
		name,
		company,
		specialty,
		phone,
		email,
		address,
		zipcode,
		city,
		notes,
	} = fields;
	if (!name)
		return res.status(400).json({ message: "Le nom est obligatoire." });
	try {
		const item = await Provider.create({
			name,
			company: company || null,
			specialty: specialty || null,
			phone: phone || null,
			email: email || null,
			address: address || null,
			zipcode: zipcode || null,
			city: city || null,
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
		name,
		company,
		specialty,
		phone,
		email,
		address,
		zipcode,
		city,
		notes,
	} = fields;
	try {
		const [num] = await Provider.update(
			{
				name,
				company: company || null,
				specialty: specialty || null,
				phone: phone || null,
				email: email || null,
				address: address || null,
				zipcode: zipcode || null,
				city: city || null,
				notes: notes || null,
			},
			{ where: { id: req.params.id } },
		);
		if (num > 0)
			return res.status(200).json({ message: "Prestataire mis à jour." });
		res.status(404).json({ message: "Prestataire introuvable." });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

exports.delete = async (req: Request, res: Response) => {
	try {
		const num = await Provider.destroy({ where: { id: req.params.id } });
		if (num === 1)
			return res
				.status(200)
				.json({ message: "Prestataire supprimé.", isDeleted: true });
		res
			.status(404)
			.json({ message: "Prestataire introuvable.", isDeleted: false });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};
