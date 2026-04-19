import type { Sequelize } from "sequelize";

module.exports = (
	sequelize: Sequelize,
	{ DataTypes }: { DataTypes: typeof import("sequelize").DataTypes },
) => {
	const Maintenance = sequelize.define(
		"Maintenance",
		{
			property_id: { type: DataTypes.INTEGER, allowNull: false },
			tenant_id: { type: DataTypes.INTEGER, allowNull: true },
			title: { type: DataTypes.STRING, allowNull: false },
			description: { type: DataTypes.TEXT, allowNull: true },
			type: {
				type: DataTypes.ENUM(
					"plomberie",
					"electricite",
					"chauffage",
					"serrurerie",
					"peinture",
					"nettoyage",
					"travaux",
					"autre",
				),
				allowNull: false,
				defaultValue: "autre",
			},
			priority: {
				type: DataTypes.ENUM("low", "medium", "high", "urgent"),
				allowNull: false,
				defaultValue: "medium",
			},
			status: {
				type: DataTypes.ENUM("open", "in_progress", "resolved", "closed"),
				allowNull: false,
				defaultValue: "open",
			},
			reported_at: { type: DataTypes.DATEONLY, allowNull: true },
			resolved_at: { type: DataTypes.DATEONLY, allowNull: true },
			provider_name: { type: DataTypes.STRING, allowNull: true },
			provider_phone: { type: DataTypes.STRING, allowNull: true },
			estimated_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
			actual_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
			notes: { type: DataTypes.TEXT, allowNull: true },
		},
		{},
	);

	return Maintenance;
};
