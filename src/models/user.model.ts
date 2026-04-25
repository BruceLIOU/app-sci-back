import type { Sequelize } from "sequelize";

module.exports = (
	sequelize: Sequelize,
	{ DataTypes }: { DataTypes: typeof import("sequelize").DataTypes },
) => {
	const User = sequelize.define(
		"User",
		{
			google_id: { type: DataTypes.STRING, allowNull: true, unique: true },
			email: { type: DataTypes.STRING, allowNull: false, unique: true },
			name: { type: DataTypes.STRING, allowNull: true },
			avatar: { type: DataTypes.STRING, allowNull: true },
			role: {
				type: DataTypes.ENUM("admin", "viewer", "locataire"),
				allowNull: false,
				defaultValue: "viewer",
			},
			tenant_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			status: {
				type: DataTypes.ENUM("pending", "active"),
				allowNull: false,
				defaultValue: "pending",
			},
			// Token d'invitation (hashé SHA-256 en base)
			invite_token_hash: { type: DataTypes.STRING, allowNull: true },
			invite_token_expiry: { type: DataTypes.DATE, allowNull: true },
			// Code de connexion éphémère (hashé SHA-256 en base)
			login_token_hash: { type: DataTypes.STRING, allowNull: true },
			login_token_expiry: { type: DataTypes.DATE, allowNull: true },
			// JSON stringifié : { darkMode: false, ... }
			preferences: {
				type: DataTypes.TEXT,
				allowNull: false,
				defaultValue: '{"darkMode":false}',
			},
		},
		{},
	);

	return User;
};
