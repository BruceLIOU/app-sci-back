import { DataTypes, type Sequelize } from "sequelize";

module.exports = (
	sequelize: Sequelize,
	{ DataTypes }: { DataTypes: typeof import("sequelize").DataTypes },
) => {
	const Property = sequelize.define(
		"Property",
		{
			address: {
				type: DataTypes.STRING,
			},
			zipcode: {
				type: DataTypes.INTEGER,
			},
			city: {
				type: DataTypes.STRING,
			},
			type: {
				type: DataTypes.STRING,
			},
			pieces: {
				type: DataTypes.INTEGER,
			},
			area: {
				type: DataTypes.INTEGER,
			},
			thumbnail: {
				type: DataTypes.STRING,
			},
			images: {
				type: DataTypes.TEXT,
			},
			rooms: {
				type: DataTypes.TEXT,
			},
			features: {
				type: DataTypes.TEXT,
			},
			comments: {
				type: DataTypes.TEXT,
			},
			latitude: {
				type: DataTypes.FLOAT,
			},
			longitude: {
				type: DataTypes.FLOAT,
			},
			dpe_class: { type: DataTypes.STRING, allowNull: true },
			dpe_value: { type: DataTypes.FLOAT, allowNull: true },
			dpe_date: { type: DataTypes.DATEONLY, allowNull: true },
			ges_class: { type: DataTypes.STRING, allowNull: true },
			ges_value: { type: DataTypes.FLOAT, allowNull: true },
			diagnostic_amiante: { type: DataTypes.BOOLEAN, allowNull: true },
			diagnostic_plomb: { type: DataTypes.BOOLEAN, allowNull: true },
			diagnostic_elec: { type: DataTypes.BOOLEAN, allowNull: true },
			diagnostic_gaz: { type: DataTypes.BOOLEAN, allowNull: true },
			diagnostic_date: { type: DataTypes.DATEONLY, allowNull: true },
		},
		{},
	);

	return Property;
};
