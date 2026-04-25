import type { Sequelize } from "sequelize";

module.exports = (
	sequelize: Sequelize,
	{ DataTypes }: { DataTypes: typeof import("sequelize").DataTypes },
) => {
	const Charge = sequelize.define(
		"Charge",
		{
			property_id: { type: DataTypes.INTEGER, allowNull: true },
			type: {
				type: DataTypes.ENUM(
					"assurance",
					"taxe_fonciere",
					"entretien",
					"travaux",
					"charges_copro",
					"frais_gestion",
					"autre",
				),
				defaultValue: "autre",
			},
			description: { type: DataTypes.STRING },
			amount: { type: DataTypes.DECIMAL(10, 2) },
			date: { type: DataTypes.DATEONLY },
			frequency: {
				type: DataTypes.ENUM("unique", "mensuel", "trimestriel", "annuel"),
				defaultValue: "unique",
			},
			tva_rate: {
				type: DataTypes.DECIMAL(5, 2),
				allowNull: true,
				defaultValue: null,
			},
		},
		{},
	);

	return Charge;
};
