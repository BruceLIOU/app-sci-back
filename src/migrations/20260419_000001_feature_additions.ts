import { DataTypes, type QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
	// Garant fields on Tenants
	await queryInterface.addColumn("Tenants", "guarantor_civility", {
		type: DataTypes.STRING,
		allowNull: true,
	});
	await queryInterface.addColumn("Tenants", "guarantor_firstname", {
		type: DataTypes.STRING,
		allowNull: true,
	});
	await queryInterface.addColumn("Tenants", "guarantor_lastname", {
		type: DataTypes.STRING,
		allowNull: true,
	});
	await queryInterface.addColumn("Tenants", "guarantor_email", {
		type: DataTypes.STRING,
		allowNull: true,
	});
	await queryInterface.addColumn("Tenants", "guarantor_mobile", {
		type: DataTypes.STRING,
		allowNull: true,
	});
	await queryInterface.addColumn("Tenants", "guarantor_address", {
		type: DataTypes.STRING,
		allowNull: true,
	});
	await queryInterface.addColumn("Tenants", "guarantor_zipcode", {
		type: DataTypes.STRING,
		allowNull: true,
	});
	await queryInterface.addColumn("Tenants", "guarantor_city", {
		type: DataTypes.STRING,
		allowNull: true,
	});

	// Diagnostic fields on Properties
	await queryInterface.addColumn("Properties", "dpe_class", {
		type: DataTypes.STRING,
		allowNull: true,
	});
	await queryInterface.addColumn("Properties", "dpe_value", {
		type: DataTypes.FLOAT,
		allowNull: true,
	});
	await queryInterface.addColumn("Properties", "dpe_date", {
		type: DataTypes.DATEONLY,
		allowNull: true,
	});
	await queryInterface.addColumn("Properties", "ges_class", {
		type: DataTypes.STRING,
		allowNull: true,
	});
	await queryInterface.addColumn("Properties", "ges_value", {
		type: DataTypes.FLOAT,
		allowNull: true,
	});
	await queryInterface.addColumn("Properties", "diagnostic_amiante", {
		type: DataTypes.BOOLEAN,
		allowNull: true,
	});
	await queryInterface.addColumn("Properties", "diagnostic_plomb", {
		type: DataTypes.BOOLEAN,
		allowNull: true,
	});
	await queryInterface.addColumn("Properties", "diagnostic_elec", {
		type: DataTypes.BOOLEAN,
		allowNull: true,
	});
	await queryInterface.addColumn("Properties", "diagnostic_gaz", {
		type: DataTypes.BOOLEAN,
		allowNull: true,
	});
	await queryInterface.addColumn("Properties", "diagnostic_date", {
		type: DataTypes.DATEONLY,
		allowNull: true,
	});

	// Maintenance module
	await queryInterface.createTable("Maintenances", {
		id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		property_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: { model: "Properties", key: "id" },
			onDelete: "CASCADE",
		},
		tenant_id: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: { model: "Tenants", key: "id" },
			onDelete: "SET NULL",
		},
		title: { type: DataTypes.STRING, allowNull: false },
		description: { type: DataTypes.TEXT, allowNull: true },
		type: {
			type: DataTypes.ENUM(
				"plomberie",
				"electricite",
				"chauffage",
				"serrurerie",
				"peinture",
				"nettoyage",
				"travaux",
				"autre",
			),
			allowNull: false,
			defaultValue: "autre",
		},
		priority: {
			type: DataTypes.ENUM("low", "medium", "high", "urgent"),
			allowNull: false,
			defaultValue: "medium",
		},
		status: {
			type: DataTypes.ENUM("open", "in_progress", "resolved", "closed"),
			allowNull: false,
			defaultValue: "open",
		},
		reported_at: { type: DataTypes.DATEONLY, allowNull: true },
		resolved_at: { type: DataTypes.DATEONLY, allowNull: true },
		provider_name: { type: DataTypes.STRING, allowNull: true },
		provider_phone: { type: DataTypes.STRING, allowNull: true },
		estimated_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
		actual_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
		notes: { type: DataTypes.TEXT, allowNull: true },
		createdAt: { type: DataTypes.DATE, allowNull: false },
		updatedAt: { type: DataTypes.DATE, allowNull: false },
	});

	// IRL reference on Leases
	await queryInterface.addColumn("Leases", "irl_reference", {
		type: DataTypes.FLOAT,
		allowNull: true,
	});
	await queryInterface.addColumn("Leases", "last_irl_revision", {
		type: DataTypes.DATEONLY,
		allowNull: true,
	});

	// New notification types (PostgreSQL ENUM extension)
	const seq = (queryInterface as any).sequelize;
	await seq.query(
		`ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS 'lease_expiry'`,
	);
	await seq.query(
		`ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS 'payment_reminder'`,
	);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
	const guarantorCols = [
		"guarantor_civility",
		"guarantor_firstname",
		"guarantor_lastname",
		"guarantor_email",
		"guarantor_mobile",
		"guarantor_address",
		"guarantor_zipcode",
		"guarantor_city",
	];
	for (const col of guarantorCols)
		await queryInterface.removeColumn("Tenants", col);

	const diagnosticCols = [
		"dpe_class",
		"dpe_value",
		"dpe_date",
		"ges_class",
		"ges_value",
		"diagnostic_amiante",
		"diagnostic_plomb",
		"diagnostic_elec",
		"diagnostic_gaz",
		"diagnostic_date",
	];
	for (const col of diagnosticCols)
		await queryInterface.removeColumn("Properties", col);
	// Note: cannot remove ENUM values in PostgreSQL without recreating the type
}
