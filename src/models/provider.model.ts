import type { Sequelize } from "sequelize";

module.exports = (
	sequelize: Sequelize,
	{ DataTypes }: { DataTypes: typeof import("sequelize").DataTypes },
) => {
	const Provider = sequelize.define(
		"Provider",
		{
			name: { type: DataTypes.STRING, allowNull: false },
			company: { type: DataTypes.STRING, allowNull: true },
			specialty: { type: DataTypes.STRING, allowNull: true },
			phone: { type: DataTypes.STRING, allowNull: true },
			email: { type: DataTypes.STRING, allowNull: true },
			address: { type: DataTypes.STRING, allowNull: true },
			zipcode: { type: DataTypes.STRING, allowNull: true },
			city: { type: DataTypes.STRING, allowNull: true },
			notes: { type: DataTypes.TEXT, allowNull: true },
		},
		{},
	);

	return Provider;
};
