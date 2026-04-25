import { DataTypes, type QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
	// Providers table
	await queryInterface.createTable("Providers", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: { type: DataTypes.STRING, allowNull: false },
		company: { type: DataTypes.STRING, allowNull: true },
		specialty: { type: DataTypes.STRING, allowNull: true },
		phone: { type: DataTypes.STRING, allowNull: true },
		email: { type: DataTypes.STRING, allowNull: true },
		address: { type: DataTypes.STRING, allowNull: true },
		zipcode: { type: DataTypes.STRING, allowNull: true },
		city: { type: DataTypes.STRING, allowNull: true },
		notes: { type: DataTypes.TEXT, allowNull: true },
		createdAt: { type: DataTypes.DATE, allowNull: false },
		updatedAt: { type: DataTypes.DATE, allowNull: false },
	});

	// monthly_income on Tenants for solvency scoring
	await queryInterface.addColumn("Tenants", "monthly_income", {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: true,
	});

	// tva_rate on Charges
	await queryInterface.addColumn("Charges", "tva_rate", {
		type: DataTypes.DECIMAL(5, 2),
		allowNull: true,
		defaultValue: null,
	});

	// Configurable alert thresholds on OwnerConfigs
	await queryInterface.addColumn("OwnerConfigs", "payment_reminder_days", {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: "5,15,30",
	});
	await queryInterface.addColumn("OwnerConfigs", "lease_expiry_alert_days", {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: "30,90",
	});
}

export async function down(queryInterface: QueryInterface): Promise<void> {
	await queryInterface.dropTable("Providers");
	await queryInterface.removeColumn("Tenants", "monthly_income");
	await queryInterface.removeColumn("Charges", "tva_rate");
	await queryInterface.removeColumn("OwnerConfigs", "payment_reminder_days");
	await queryInterface.removeColumn("OwnerConfigs", "lease_expiry_alert_days");
}
