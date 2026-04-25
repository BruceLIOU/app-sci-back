import type { QueryInterface } from "sequelize";

const FRENCH_MONTHS: Record<string, string> = {
	janvier: "01",
	février: "02",
	mars: "03",
	avril: "04",
	mai: "05",
	juin: "06",
	juillet: "07",
	août: "08",
	septembre: "09",
	octobre: "10",
	novembre: "11",
	décembre: "12",
};

export async function up(queryInterface: QueryInterface): Promise<void> {
	const sequelize = (queryInterface as any).sequelize;

	// Convertit les valeurs "Mois AAAA" (ex: "Avril 2026") en "YYYY-MM" (ex: "2026-04")
	for (const [frMonth, num] of Object.entries(FRENCH_MONTHS)) {
		// Normalisation insensible à la casse et aux accents via ILIKE
		await sequelize.query(
			`UPDATE "Payments"
       SET month = CONCAT(SPLIT_PART(month, ' ', 2), '-', :num)
       WHERE month ~* :pattern`,
			{
				replacements: {
					num,
					pattern: `^${frMonth}\\s+\\d{4}$`,
				},
			},
		);
	}
}

export async function down(_queryInterface: QueryInterface): Promise<void> {
	// Pas de rollback : la donnée normalisée est la forme cible
}
