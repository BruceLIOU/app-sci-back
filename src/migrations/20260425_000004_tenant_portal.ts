import { DataTypes, type QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
	await queryInterface.addColumn("OwnerConfigs", "payment_reminder_enabled", {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: true,
	});

	// PostgreSQL native ENUM requires raw SQL outside a transaction
	await (queryInterface as any).sequelize.query(
		`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'locataire'`,
	);

	await queryInterface.addColumn("Users", "tenant_id", {
		type: DataTypes.INTEGER,
		allowNull: true,
		references: { model: "Tenants", key: "id" },
		onUpdate: "CASCADE",
		onDelete: "SET NULL",
	});
}

export async function down(queryInterface: QueryInterface): Promise<void> {
	await queryInterface.removeColumn("OwnerConfigs", "payment_reminder_enabled");
	await queryInterface.removeColumn("Users", "tenant_id");
	// PostgreSQL does not support removing ENUM values — intentionally left without rollback
}
