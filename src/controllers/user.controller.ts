import crypto from "node:crypto";
import type { Request, Response } from "express";
import { sendInvitationEmail } from "../services/email.service";
import { createNotification } from "../services/notification.service";

const db = require("../models");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const TOKEN_EXPIRY_HOURS = 24;

function hashToken(token: string): string {
	return crypto.createHash("sha256").update(token).digest("hex");
}

// GET /api/users
exports.getAll = async (_req: Request, res: Response) => {
	try {
		const users = await db.User.findAll({
			attributes: [
				"id",
				"email",
				"name",
				"avatar",
				"role",
				"status",
				"tenant_id",
				"createdAt",
			],
			order: [["createdAt", "ASC"]],
		});
		res.json(users);
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

// POST /api/users — inviter un utilisateur
exports.invite = async (req: Request, res: Response) => {
	const f = (req as any).fields || {};
	const email = (f.email as string)?.trim().toLowerCase();
	const name = (f.name as string)?.trim() || null;
	const role = (f.role as string) || "viewer";
	const tenant_id = f.tenant_id ? Number(f.tenant_id) : null;

	if (!email) return res.status(400).json({ message: "L'email est requis." });
	if (!["admin", "viewer", "locataire"].includes(role))
		return res.status(400).json({ message: "Rôle invalide." });
	if (role === "locataire" && !tenant_id)
		return res
			.status(400)
			.json({ message: "Un locataire doit être associé à un tenant." });

	try {
		const existing = await db.User.findOne({ where: { email } });
		if (existing)
			return res
				.status(409)
				.json({ message: "Un utilisateur avec cet email existe déjà." });

		// Génération d'un token cryptographiquement aléatoire
		const rawToken = crypto.randomBytes(32).toString("hex");
		const tokenHash = hashToken(rawToken);
		const expiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

		const user = await db.User.create({
			email,
			name,
			role,
			tenant_id: role === "locataire" ? tenant_id : null,
			status: "pending",
			invite_token_hash: tokenHash,
			invite_token_expiry: expiry,
		});

		const activationLink = `${FRONTEND_URL}/#/activate?token=${rawToken}`;
		await sendInvitationEmail(email, activationLink);
		await createNotification({
			type: "email_sent",
			title: "Invitation utilisateur envoyée",
			message: `Email d'invitation envoyé à ${email} (rôle : ${role})`,
			metadata: {
				reference_type: "user",
				reference_id: user.id,
				recipient: email,
			},
		});

		res.status(201).json({
			id: user.id,
			email: user.email,
			role: user.role,
			status: user.status,
		});
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

// POST /api/users/:id/resend — renvoyer l'invitation
exports.resendInvite = async (req: Request, res: Response) => {
	try {
		const user = await db.User.findByPk(req.params.id);
		if (!user)
			return res.status(404).json({ message: "Utilisateur introuvable." });
		if (user.status === "active")
			return res.status(400).json({ message: "Ce compte est déjà actif." });

		const rawToken = crypto.randomBytes(32).toString("hex");
		const tokenHash = hashToken(rawToken);
		const expiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

		await user.update({
			invite_token_hash: tokenHash,
			invite_token_expiry: expiry,
		});

		const activationLink = `${FRONTEND_URL}/#/activate?token=${rawToken}`;
		await sendInvitationEmail(user.email, activationLink);
		await createNotification({
			type: "email_sent",
			title: "Invitation utilisateur renvoyée",
			message: `Email d'invitation renvoyé à ${user.email}`,
			metadata: {
				reference_type: "user",
				reference_id: user.id,
				recipient: user.email,
			},
		});

		res.json({ message: "Invitation renvoyée." });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

// PATCH /api/users/:id — mettre à jour un utilisateur
exports.update = async (req: Request, res: Response) => {
	const f = (req as any).fields || {};
	const name = "name" in f ? (f.name as string)?.trim() || null : undefined;
	const role = f.role as string | undefined;
	const tenant_id = f.tenant_id ? Number(f.tenant_id) : undefined;

	if (role && !["admin", "viewer", "locataire"].includes(role)) {
		return res.status(400).json({ message: "Rôle invalide." });
	}
	if (role === "locataire" && !tenant_id) {
		return res
			.status(400)
			.json({ message: "Un locataire doit être associé à un tenant." });
	}
	try {
		const user = await db.User.findByPk(req.params.id);
		if (!user)
			return res.status(404).json({ message: "Utilisateur introuvable." });

		const currentUser = (req as any).user;
		if (role && currentUser.id === user.id) {
			return res
				.status(400)
				.json({ message: "Vous ne pouvez pas modifier votre propre rôle." });
		}

		const updates: any = {};
		if (name !== undefined) updates.name = name;
		if (role) {
			updates.role = role;
			updates.tenant_id = role === "locataire" ? tenant_id : null;
		}

		await user.update(updates);
		res.json({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			tenant_id: user.tenant_id,
			status: user.status,
		});
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

// PATCH /api/users/:id/role — changer le rôle
exports.updateRole = async (req: Request, res: Response) => {
	const f = (req as any).fields || {};
	const role = f.role as string;
	const tenant_id = f.tenant_id ? Number(f.tenant_id) : undefined;

	if (!["admin", "viewer", "locataire"].includes(role)) {
		return res.status(400).json({ message: "Rôle invalide." });
	}
	if (role === "locataire" && !tenant_id) {
		return res
			.status(400)
			.json({ message: "Un locataire doit être associé à un tenant." });
	}
	try {
		const user = await db.User.findByPk(req.params.id);
		if (!user)
			return res.status(404).json({ message: "Utilisateur introuvable." });

		const currentUser = (req as any).user;
		if (currentUser.id === user.id) {
			return res
				.status(400)
				.json({ message: "Vous ne pouvez pas modifier votre propre rôle." });
		}

		const updates: any = { role };
		if (role === "locataire") updates.tenant_id = tenant_id;
		else updates.tenant_id = null;

		await user.update(updates);
		res.json({
			id: user.id,
			email: user.email,
			role: user.role,
			tenant_id: user.tenant_id,
		});
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

// DELETE /api/users/:id — supprimer un utilisateur
exports.remove = async (req: Request, res: Response) => {
	try {
		const user = await db.User.findByPk(req.params.id);
		if (!user)
			return res.status(404).json({ message: "Utilisateur introuvable." });

		const currentUser = (req as any).user;
		if (currentUser.id === user.id) {
			return res
				.status(400)
				.json({ message: "Vous ne pouvez pas supprimer votre propre compte." });
		}

		await user.destroy();
		res.json({ message: "Utilisateur supprimé." });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};
