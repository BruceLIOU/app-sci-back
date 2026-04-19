import type { Sequelize } from "sequelize";

module.exports = (
	sequelize: Sequelize,
	{ DataTypes }: { DataTypes: typeof import("sequelize").DataTypes },
) => {
	const Tenant = sequelize.define(
		"Tenant",
		{
			civility: {
				type: DataTypes.STRING,
			},
			firstname: {
				type: DataTypes.STRING,
			},
			lastname: {
				type: DataTypes.STRING,
			},
			email: {
				type: DataTypes.STRING,
			},
			mobile: {
				type: DataTypes.STRING,
			},
			property_id: {
				type: DataTypes.INTEGER,
			},
			avatar: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			comments: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			previous_address: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			previous_zipcode: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			previous_city: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			is_active: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
			},
			guarantor_civility: { type: DataTypes.STRING, allowNull: true },
			guarantor_firstname: { type: DataTypes.STRING, allowNull: true },
			guarantor_lastname: { type: DataTypes.STRING, allowNull: true },
			guarantor_email: { type: DataTypes.STRING, allowNull: true },
			guarantor_mobile: { type: DataTypes.STRING, allowNull: true },
			guarantor_address: { type: DataTypes.STRING, allowNull: true },
			guarantor_zipcode: { type: DataTypes.STRING, allowNull: true },
			guarantor_city: { type: DataTypes.STRING, allowNull: true },
		},
		{},
	);

	return Tenant;
};
