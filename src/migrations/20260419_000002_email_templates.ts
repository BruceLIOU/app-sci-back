import { DataTypes, type QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
	const tableDesc = await queryInterface.describeTable("OwnerConfigs");
	const cols = [
		"email_template_payment_reminder",
		"email_template_lease_expiry",
		"email_template_quittance",
	];
	for (const col of cols) {
		if (!tableDesc[col]) {
			await queryInterface.addColumn("OwnerConfigs", col, {
				type: DataTypes.TEXT,
				allowNull: true,
			});
		}
	}
}

export async function down(queryInterface: QueryInterface): Promise<void> {
	const cols = [
		"email_template_payment_reminder",
		"email_template_lease_expiry",
		"email_template_quittance",
	];
	for (const col of cols) {
		await queryInterface.removeColumn("OwnerConfigs", col);
	}
}
