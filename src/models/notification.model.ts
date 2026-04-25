import type { Sequelize } from "sequelize";

module.exports = (
	sequelize: Sequelize,
	{ DataTypes }: { DataTypes: typeof import("sequelize").DataTypes },
) => {
	const Notification = sequelize.define(
		"Notification",
		{
			type: {
				type: DataTypes.ENUM(
					"matera_charge",
					"email_sent",
					"lease_expiry",
					"payment_reminder",
					"maintenance_report",
				),
				allowNull: false,
			},
			title: { type: DataTypes.STRING, allowNull: false },
			message: { type: DataTypes.STRING, allowNull: true },
			is_read: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			metadata: { type: DataTypes.JSON, allowNull: true },
		},
		{
			tableName: "notifications",
			updatedAt: false,
		},
	);

	return Notification;
};
