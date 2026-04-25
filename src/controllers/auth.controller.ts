import crypto from "node:crypto";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import cloudinary from "../config/cloudinary.config";
import * as EmailService from "../services/email.service";

const db = require("../models");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const JWT_EXPIRY = "7d";
const COOKIE_NAME = "landlord_token";
const LEGACY_COOKIE_NAME = "sci_token";
const LOGIN_CODE_TTL_MINUTES = 15;
const LOGIN_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function issueToken(userId: number): string {
	return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function setTokenCookie(res: Response, token: string) {
	res.cookie(COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
	});
}

function normalizeLoginCode(value: unknown): string {
	return String(value || "")
		.trim()
		.toUpperCase();
}

function generateLoginCode(length = 6): string {
	let output = "";
	for (let index = 0; index < length; index += 1) {
		const randomIndex = crypto.randomInt(0, LOGIN_CODE_ALPHABET.length);
		output += LOGIN_CODE_ALPHABET[randomIndex];
	}
	return output;
}

// POST /api/auth/request-login — envoyer un code de connexion éphémère
exports.requestLogin = async (req: Request, res: Response) => {
	const email = (req as any).fields?.email || req.body?.email;
	if (!email || typeof email !== "string") {
		return res.status(400).json({ message: "Email requis." });
	}
	try {
		const user = await db.User.findOne({
			where: { email: email.toLowerCase().trim() },
		});
		// Réponse générique pour ne pas révéler l'existence du compte
		if (!user || user.status !== "active") {
			return res.json({
				message:
					"Si votre email est connu, vous recevrez un code de connexion.",
			});
		}

		const loginCode = generateLoginCode();
		const tokenHash = crypto
			.createHash("sha256")
			.update(loginCode)
			.digest("hex");
		const expiry = new Date(Date.now() + LOGIN_CODE_TTL_MINUTES * 60 * 1000);

		await user.update({
			login_token_hash: tokenHash,
			login_token_expiry: expiry,
		});

		await EmailService.sendLoginCodeEmail(
			user.email,
			loginCode,
			LOGIN_CODE_TTL_MINUTES,
		);

		res.json({
			message: "Si votre email est connu, vous recevrez un code de connexion.",
			expiresInMinutes: LOGIN_CODE_TTL_MINUTES,
		});
	} catch (e: any) {
		console.error("Request login error:", e.message);
		res.status(500).json({ message: "Erreur serveur." });
	}
};

// POST /api/auth/verify-login — valider le code de connexion éphémère
exports.verifyLogin = async (req: Request, res: Response) => {
	const email = String((req as any).fields?.email || req.body?.email || "")
		.trim()
		.toLowerCase();
	const code = normalizeLoginCode((req as any).fields?.code || req.body?.code);

	if (!email || !code || code.length !== 6) {
		return res
			.status(400)
			.json({ message: "Email et code de connexion requis." });
	}

	try {
		const tokenHash = crypto.createHash("sha256").update(code).digest("hex");
		const user = await db.User.findOne({
			where: { email, login_token_hash: tokenHash },
		});

		if (!user) {
			return res.status(400).json({ message: "Code de connexion invalide." });
		}
		if (
			!user.login_token_expiry ||
			new Date() > new Date(user.login_token_expiry)
		) {
			await user.update({ login_token_hash: null, login_token_expiry: null });
			return res
				.status(400)
				.json({ message: "Ce code a expiré. Demandez-en un nouveau." });
		}

		// Invalider le code (usage unique)
		await user.update({ login_token_hash: null, login_token_expiry: null });

		const jwt_token = issueToken(user.id);
		setTokenCookie(res, jwt_token);
		res.json({ message: "Connexion réussie." });
	} catch (e: any) {
		console.error("Verify login error:", e.message);
		res.status(500).json({ message: "Échec de l’authentification." });
	}
};

// GET /api/auth/activate?token=<token> — valider le lien magique
exports.activateAccount = async (req: Request, res: Response) => {
	const { token } = req.query;
	if (!token || typeof token !== "string") {
		return res.status(400).json({ message: "Token invalide." });
	}

	try {
		const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
		const user = await db.User.findOne({
			where: { invite_token_hash: tokenHash },
		});

		if (!user) {
			return res
				.status(400)
				.json({ message: "Ce lien d'activation est invalide." });
		}
		if (user.status === "active") {
			return res.status(400).json({ message: "Ce compte est déjà actif." });
		}
		if (
			!user.invite_token_expiry ||
			new Date() > new Date(user.invite_token_expiry)
		) {
			return res
				.status(400)
				.json({
					message:
						"Ce lien a expiré. Contactez un administrateur pour obtenir un nouveau lien.",
				});
		}

		// Activer le compte et invalider le token (usage unique)
		await user.update({
			status: "active",
			invite_token_hash: null,
			invite_token_expiry: null,
		});

		res.json({ message: "Compte activé avec succès.", email: user.email });
	} catch (e: any) {
		console.error("Activate account error:", e.message);
		res.status(500).json({ message: "Erreur serveur." });
	}
};

// POST /api/auth/logout
exports.logout = (_req: Request, res: Response) => {
	res.clearCookie(COOKIE_NAME);
	res.clearCookie(LEGACY_COOKIE_NAME);
	res.json({ message: "Déconnecté." });
};

// GET /api/auth/me
exports.me = async (req: Request, res: Response) => {
	try {
		const user = (req as any).user;
		res.json({
			id: user.id,
			email: user.email,
			name: user.name,
			avatar: user.avatar,
			role: user.role,
			tenant_id: user.tenant_id ?? null,
			preferences: JSON.parse(user.preferences || "{}"),
		});
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

// PUT /api/auth/preferences
exports.updatePreferences = async (req: Request, res: Response) => {
	const f = (req as any).fields || {};
	try {
		const user = (req as any).user;
		const current = JSON.parse(user.preferences || "{}");
		// Fusionner les préférences envoyées
		const updated = { ...current };
		if (f.darkMode !== undefined) updated.darkMode = f.darkMode === "true";
		if (f.onboardingGoogleConnectionVerified !== undefined) {
			updated.onboardingGoogleConnectionVerified =
				f.onboardingGoogleConnectionVerified === "true";
		}
		if (f.onboardingEmailConnectionVerified !== undefined) {
			updated.onboardingEmailConnectionVerified =
				f.onboardingEmailConnectionVerified === "true";
		}
		await user.update({ preferences: JSON.stringify(updated) });
		res.json({ preferences: updated });
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

// PUT /api/auth/profile
exports.updateProfile = async (req: Request, res: Response) => {
	const f = (req as any).fields || {};
	try {
		const user = (req as any).user;
		if (f.name) await user.update({ name: f.name });
		res.json({
			id: user.id,
			email: user.email,
			name: f.name || user.name,
			avatar: user.avatar,
			role: user.role,
			preferences: JSON.parse(user.preferences || "{}"),
		});
	} catch (e: any) {
		res.status(500).json({ message: e.message });
	}
};

interface FormidableFile {
	name: string;
	path: string;
	size: number;
	type: string;
}

// POST /api/auth/avatar — upload d'avatar via Cloudinary
exports.uploadAvatar = async (req: Request, res: Response) => {
	const file = req.files?.avatar as FormidableFile | undefined;
	if (!file) {
		return res.status(400).json({ message: "Aucun fichier envoyé." });
	}
	if (!file.type.startsWith("image/")) {
		return res.status(400).json({ message: "Le fichier doit être une image." });
	}
	try {
		const user = (req as any).user;

		// Supprimer l'ancien avatar Cloudinary si présent
		if (user.avatar?.includes("cloudinary.com")) {
			const match = user.avatar.match(
				/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i,
			);
			if (match) {
				await cloudinary.uploader.destroy(match[1]).catch(() => {});
			}
		}

		const result = await cloudinary.uploader.upload(file.path, {
			folder: "landlords/avatars",
			transformation: [
				{ width: 200, height: 200, crop: "fill", gravity: "face" },
			],
		});

		await user.update({ avatar: result.secure_url });
		res.json({ avatar: result.secure_url });
	} catch (e: any) {
		console.error("Upload avatar error:", e.message);
		res.status(500).json({ message: "Erreur lors de l'upload de l'avatar." });
	}
};
