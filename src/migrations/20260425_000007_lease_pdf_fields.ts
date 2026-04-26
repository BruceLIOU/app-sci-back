import { DataTypes, type QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
	await queryInterface.addColumn("Leases", "pdf_url", {
		type: DataTypes.STRING,
		allowNull: true,
	});
	await queryInterface.addColumn("Leases", "pdf_generated_at", {
		type: DataTypes.DATE,
		allowNull: true,
	});
}

export async function down(queryInterface: QueryInterface): Promise<void> {
	await queryInterface.removeColumn("Leases", "pdf_url");
	await queryInterface.removeColumn("Leases", "pdf_generated_at");
}
