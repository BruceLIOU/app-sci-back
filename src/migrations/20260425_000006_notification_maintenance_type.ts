import type { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
	const sequelize = (queryInterface as any).sequelize;
	await sequelize.query(
		`ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS 'maintenance_report'`,
	);
}

export async function down(_queryInterface: QueryInterface): Promise<void> {
	// PostgreSQL ne supporte pas la suppression de valeurs d'un ENUM
}
