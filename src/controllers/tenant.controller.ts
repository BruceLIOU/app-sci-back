import type { Request, Response } from "express";
import cloudinary from "../config/cloudinary.config";

const db = require("../models");
const Tenant = db.Tenant;
const Property = db.Property;

interface FormidableFile {
	name: string;
	path: string;
	size: number;
	type: string;
}

const uploadToCloudinary = async (file: FormidableFile): Promise<string> => {
	const result = await cloudinary.uploader.upload(file.path, {
		folder: "landlords/tenants",
		resource_type: "image",
	});
	return result.secure_url;
};

const getPublicId = (url: string): string => {
	const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
	return match ? match[1] : "";
};

exports.create = async (req: Request, res: Response) => {
	if (!req.fields.lastname) {
		return res.status(400).json({ message: "Le nom ne peut pas être vide !" });
	}

	const tenant = {
		civility: req.fields.civility,
		firstname: req.fields.firstname,
		lastname: req.fields.lastname,
		email: req.fields.email,
		mobile: req.fields.mobile,
		property_id: req.fields.property_id || null,
		comments: req.fields.comments || null,
		previous_address: req.fields.previous_address || null,
		previous_zipcode: req.fields.previous_zipcode || null,
		previous_city: req.fields.previous_city || null,
		monthly_income: req.fields.monthly_income || null,
		avatar: null as string | null,
	};

	try {
		if (req.files?.avatar) {
			tenant.avatar = await uploadToCloudinary(
				req.files.avatar as FormidableFile,
			);
		}
		const result = await Tenant.create(tenant);
		res.status(201).json(result);
	} catch (error: any) {
		console.log(error.message);
		res
			.status(500)
			.json({ message: "Erreur lors de la création du locataire." });
	}
};

exports.findAll = async (req: Request, res: Response) => {
	try {
		const data = await Tenant.findAll({
			include: [
				{
					model: Property,
					attributes: ["id", "type", "city", "area", "address"],
				},
			],
		});
		res.status(200).json(data);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
};

exports.findOne = async (req: Request, res: Response) => {
	const id = req.params.id;
	try {
		const data = await Tenant.findByPk(id, {
			include: [
				{
					model: Property,
					attributes: ["id", "type", "city", "area", "address"],
				},
			],
		});
		if (data) {
			res.status(200).json(data);
		} else {
			res.status(404).json({ message: `Locataire avec id=${id} introuvable.` });
		}
	} catch (error: any) {
		res
			.status(500)
			.json({
				message: `Erreur lors de la récupération du locataire id=${id}`,
			});
	}
};

exports.update = async (req: Request, res: Response) => {
	const id = req.params.id;
	try {
		const updateData: Record<string, any> = {};
		const scalarFields = [
			"civility",
			"firstname",
			"lastname",
			"email",
			"mobile",
			"property_id",
			"comments",
			"previous_address",
			"previous_zipcode",
			"previous_city",
			"monthly_income",
		] as const;
		for (const f of scalarFields) {
			if (req.fields?.[f] !== undefined) updateData[f] = req.fields[f] || null;
		}

		if (req.files?.avatar) {
			const existing = await Tenant.findByPk(id);
			if (existing?.avatar)
				await cloudinary.uploader.destroy(getPublicId(existing.avatar));
			updateData.avatar = await uploadToCloudinary(
				req.files.avatar as FormidableFile,
			);
		} else if (req.fields?.removeAvatar === "true") {
			const existing = await Tenant.findByPk(id);
			if (existing?.avatar)
				await cloudinary.uploader.destroy(getPublicId(existing.avatar));
			updateData.avatar = null;
		}

		const result = await Tenant.update(updateData, { where: { id } });
		if (result[0] > 0) {
			res.status(200).json({ message: "Locataire mis à jour avec succès." });
		} else {
			res.status(404).json({ message: `Locataire avec id=${id} introuvable.` });
		}
	} catch (error: any) {
		res
			.status(500)
			.json({ message: `Erreur lors de la mise à jour du locataire id=${id}` });
	}
};

exports.toggleActive = async (req: Request, res: Response) => {
	const id = req.params.id;
	try {
		const tenant = await Tenant.findByPk(id);
		if (!tenant)
			return res
				.status(404)
				.json({ message: `Locataire avec id=${id} introuvable.` });
		await tenant.update({ is_active: !tenant.is_active });
		res.status(200).json({ is_active: tenant.is_active });
	} catch (error: any) {
		res
			.status(500)
			.json({
				message: `Erreur lors du changement de statut du locataire id=${id}`,
			});
	}
};

exports.delete = async (req: Request, res: Response) => {
	const id = req.params.id;
	try {
		const num = await Tenant.destroy({ where: { id } });
		if (num === 1) {
			res
				.status(200)
				.json({ message: "Locataire supprimé avec succès !", isDeleted: true });
		} else {
			res
				.status(404)
				.json({
					message: `Locataire avec id=${id} introuvable.`,
					isDeleted: false,
				});
		}
	} catch (error: any) {
		res
			.status(500)
			.json({ message: `Erreur lors de la suppression du locataire id=${id}` });
	}
};
