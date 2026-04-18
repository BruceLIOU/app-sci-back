import { DataTypes, type QueryInterface } from "sequelize";

// ifNotExists is supported at runtime by Sequelize 6 but absent from the TS types
const IF_NOT_EXISTS = { ifNotExists: true } as unknown as Parameters<
	QueryInterface["createTable"]
>[2];

export async function up(queryInterface: QueryInterface): Promise<void> {
	await queryInterface.createTable(
		"Users",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			google_id: { type: DataTypes.STRING, allowNull: true, unique: true },
			email: { type: DataTypes.STRING, allowNull: false, unique: true },
			name: { type: DataTypes.STRING, allowNull: true },
			avatar: { type: DataTypes.STRING, allowNull: true },
			role: {
				type: DataTypes.ENUM("admin", "viewer"),
				allowNull: false,
				defaultValue: "viewer",
			},
			status: {
				type: DataTypes.ENUM("pending", "active"),
				allowNull: false,
				defaultValue: "pending",
			},
			invite_token_hash: { type: DataTypes.STRING, allowNull: true },
			invite_token_expiry: { type: DataTypes.DATE, allowNull: true },
			login_token_hash: { type: DataTypes.STRING, allowNull: true },
			login_token_expiry: { type: DataTypes.DATE, allowNull: true },
			preferences: {
				type: DataTypes.TEXT,
				allowNull: false,
				defaultValue: '{"darkMode":false}',
			},
			createdAt: { type: DataTypes.DATE, allowNull: false },
			updatedAt: { type: DataTypes.DATE, allowNull: false },
		},
		IF_NOT_EXISTS,
	);

	await queryInterface.createTable(
		"Properties",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			address: { type: DataTypes.STRING, allowNull: true },
			zipcode: { type: DataTypes.INTEGER, allowNull: true },
			city: { type: DataTypes.STRING, allowNull: true },
			type: { type: DataTypes.STRING, allowNull: true },
			pieces: { type: DataTypes.INTEGER, allowNull: true },
			area: { type: DataTypes.INTEGER, allowNull: true },
			thumbnail: { type: DataTypes.STRING, allowNull: true },
			images: { type: DataTypes.TEXT, allowNull: true },
			rooms: { type: DataTypes.TEXT, allowNull: true },
			features: { type: DataTypes.TEXT, allowNull: true },
			comments: { type: DataTypes.TEXT, allowNull: true },
			latitude: { type: DataTypes.FLOAT, allowNull: true },
			longitude: { type: DataTypes.FLOAT, allowNull: true },
			createdAt: { type: DataTypes.DATE, allowNull: false },
			updatedAt: { type: DataTypes.DATE, allowNull: false },
		},
		IF_NOT_EXISTS,
	);

	await queryInterface.createTable(
		"Associates",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			civility: { type: DataTypes.STRING, allowNull: true },
			firstname: { type: DataTypes.STRING, allowNull: true },
			lastname: { type: DataTypes.STRING, allowNull: true },
			email: { type: DataTypes.STRING, allowNull: true },
			phone: { type: DataTypes.STRING, allowNull: true },
			address: { type: DataTypes.TEXT, allowNull: true },
			shares: {
				type: DataTypes.DECIMAL(5, 2),
				allowNull: true,
				defaultValue: 0,
			},
			role: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "Co-bailleur",
			},
			createdAt: { type: DataTypes.DATE, allowNull: false },
			updatedAt: { type: DataTypes.DATE, allowNull: false },
		},
		IF_NOT_EXISTS,
	);

	await queryInterface.createTable(
		"OwnerConfigs",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			owner_profile_type: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "INDIVIDUAL",
			},
			name: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
			legal_form: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "Particulier",
			},
			siret: { type: DataTypes.STRING, allowNull: true },
			rcs: { type: DataTypes.STRING, allowNull: true },
			address: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
			zipcode: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
			city: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
			iban: { type: DataTypes.STRING, allowNull: true },
			manager_associate_id: { type: DataTypes.INTEGER, allowNull: true },
			manager_civility: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "M.",
			},
			manager_firstname: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "",
			},
			manager_lastname: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "",
			},
			manager_email: { type: DataTypes.STRING, allowNull: true },
			manager_phone: { type: DataTypes.STRING, allowNull: true },
			google_refresh_token: { type: DataTypes.TEXT, allowNull: true },
			google_calendar_id: { type: DataTypes.STRING, allowNull: true },
			smtp_host: { type: DataTypes.STRING, allowNull: true },
			smtp_port: { type: DataTypes.INTEGER, allowNull: true },
			smtp_secure: {
				type: DataTypes.BOOLEAN,
				allowNull: true,
				defaultValue: false,
			},
			smtp_user: { type: DataTypes.STRING, allowNull: true },
			smtp_pass: { type: DataTypes.TEXT, allowNull: true },
			smtp_from: { type: DataTypes.STRING, allowNull: true },
			imap_host: { type: DataTypes.STRING, allowNull: true },
			imap_port: { type: DataTypes.INTEGER, allowNull: true },
			imap_tls: {
				type: DataTypes.BOOLEAN,
				allowNull: true,
				defaultValue: true,
			},
			imap_user: { type: DataTypes.STRING, allowNull: true },
			imap_pass: { type: DataTypes.TEXT, allowNull: true },
			matera_sender_email: { type: DataTypes.STRING, allowNull: true },
			matera_property_id: { type: DataTypes.INTEGER, allowNull: true },
			charge_cron_schedule: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "0 8 * * *",
			},
			charge_cron_enabled: {
				type: DataTypes.BOOLEAN,
				allowNull: true,
				defaultValue: true,
			},
			createdAt: { type: DataTypes.DATE, allowNull: false },
			updatedAt: { type: DataTypes.DATE, allowNull: false },
		},
		IF_NOT_EXISTS,
	);

	await queryInterface.createTable(
		"Tenants",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			civility: { type: DataTypes.STRING, allowNull: true },
			firstname: { type: DataTypes.STRING, allowNull: true },
			lastname: { type: DataTypes.STRING, allowNull: true },
			email: { type: DataTypes.STRING, allowNull: true },
			mobile: { type: DataTypes.STRING, allowNull: true },
			property_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Properties", key: "id" },
				onDelete: "CASCADE",
			},
			avatar: { type: DataTypes.STRING, allowNull: true },
			comments: { type: DataTypes.TEXT, allowNull: true },
			previous_address: { type: DataTypes.STRING, allowNull: true },
			previous_zipcode: { type: DataTypes.STRING, allowNull: true },
			previous_city: { type: DataTypes.STRING, allowNull: true },
			is_active: {
				type: DataTypes.BOOLEAN,
				allowNull: true,
				defaultValue: true,
			},
			createdAt: { type: DataTypes.DATE, allowNull: false },
			updatedAt: { type: DataTypes.DATE, allowNull: false },
		},
		IF_NOT_EXISTS,
	);

	await queryInterface.createTable(
		"Leases",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			property_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Properties", key: "id" },
				onDelete: "CASCADE",
			},
			tenant_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Tenants", key: "id" },
				onDelete: "CASCADE",
			},
			type: {
				type: DataTypes.ENUM("nu", "meublé", "commercial"),
				allowNull: true,
				defaultValue: "nu",
			},
			start_date: { type: DataTypes.DATEONLY, allowNull: true },
			end_date: { type: DataTypes.DATEONLY, allowNull: true },
			rent_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
			charges_amount: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
				defaultValue: 0,
			},
			deposit_amount: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
				defaultValue: 0,
			},
			notice_period: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 3,
			},
			status: {
				type: DataTypes.ENUM("active", "expired", "terminated"),
				allowNull: true,
				defaultValue: "active",
			},
			notes: { type: DataTypes.TEXT, allowNull: true },
			email_sent_at: { type: DataTypes.DATE, allowNull: true },
			createdAt: { type: DataTypes.DATE, allowNull: false },
			updatedAt: { type: DataTypes.DATE, allowNull: false },
		},
		IF_NOT_EXISTS,
	);

	await queryInterface.createTable(
		"Payments",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			tenant_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Tenants", key: "id" },
				onDelete: "CASCADE",
			},
			property_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Properties", key: "id" },
				onDelete: "CASCADE",
			},
			amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
			due_date: { type: DataTypes.DATEONLY, allowNull: true },
			paid_date: { type: DataTypes.DATEONLY, allowNull: true },
			status: {
				type: DataTypes.ENUM("paid", "pending", "late"),
				allowNull: true,
				defaultValue: "pending",
			},
			month: { type: DataTypes.STRING, allowNull: true },
			lease_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Leases", key: "id" },
				onDelete: "CASCADE",
			},
			charges_amount: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
				defaultValue: 0,
			},
			createdAt: { type: DataTypes.DATE, allowNull: false },
			updatedAt: { type: DataTypes.DATE, allowNull: false },
		},
		IF_NOT_EXISTS,
	);

	await queryInterface.createTable(
		"Charges",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			property_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Properties", key: "id" },
				onDelete: "CASCADE",
			},
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
				allowNull: true,
				defaultValue: "autre",
			},
			description: { type: DataTypes.STRING, allowNull: true },
			amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
			date: { type: DataTypes.DATEONLY, allowNull: true },
			frequency: {
				type: DataTypes.ENUM("unique", "mensuel", "trimestriel", "annuel"),
				allowNull: true,
				defaultValue: "unique",
			},
			createdAt: { type: DataTypes.DATE, allowNull: false },
			updatedAt: { type: DataTypes.DATE, allowNull: false },
		},
		IF_NOT_EXISTS,
	);

	await queryInterface.createTable(
		"Quittances",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			number: { type: DataTypes.STRING, allowNull: true },
			tenant_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Tenants", key: "id" },
				onDelete: "CASCADE",
			},
			property_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Properties", key: "id" },
				onDelete: "CASCADE",
			},
			lease_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Leases", key: "id" },
				onDelete: "CASCADE",
			},
			payment_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Payments", key: "id" },
				onDelete: "CASCADE",
			},
			period: { type: DataTypes.STRING, allowNull: true },
			rent_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
			charges_amount: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
				defaultValue: 0,
			},
			total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
			issue_date: { type: DataTypes.DATEONLY, allowNull: true },
			email_sent_at: { type: DataTypes.DATE, allowNull: true },
			createdAt: { type: DataTypes.DATE, allowNull: false },
			updatedAt: { type: DataTypes.DATE, allowNull: false },
		},
		IF_NOT_EXISTS,
	);

	await queryInterface.createTable(
		"Inspections",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			property_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Properties", key: "id" },
				onDelete: "CASCADE",
			},
			tenant_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Tenants", key: "id" },
				onDelete: "CASCADE",
			},
			lease_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "Leases", key: "id" },
				onDelete: "CASCADE",
			},
			type: {
				type: DataTypes.ENUM("entree", "sortie"),
				allowNull: true,
				defaultValue: "entree",
			},
			date: { type: DataTypes.DATEONLY, allowNull: true },
			status: {
				type: DataTypes.ENUM("pending", "completed"),
				allowNull: true,
				defaultValue: "pending",
			},
			general_notes: { type: DataTypes.TEXT, allowNull: true },
			rooms: { type: DataTypes.TEXT, allowNull: true },
			email_sent_at: { type: DataTypes.DATE, allowNull: true },
			createdAt: { type: DataTypes.DATE, allowNull: false },
			updatedAt: { type: DataTypes.DATE, allowNull: false },
		},
		IF_NOT_EXISTS,
	);

	await queryInterface.createTable(
		"Visits",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			title: { type: DataTypes.STRING, allowNull: false },
			description: { type: DataTypes.TEXT, allowNull: true },
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
				onDelete: "CASCADE",
			},
			contact_name: { type: DataTypes.STRING, allowNull: true },
			contact_email: { type: DataTypes.STRING, allowNull: true },
			contact_phone: { type: DataTypes.STRING, allowNull: true },
			date: { type: DataTypes.DATEONLY, allowNull: false },
			time: { type: DataTypes.STRING, allowNull: false, defaultValue: "10:00" },
			duration: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
			type: {
				type: DataTypes.ENUM("visite", "rdv", "autre"),
				allowNull: false,
				defaultValue: "visite",
			},
			status: {
				type: DataTypes.ENUM("scheduled", "completed", "cancelled"),
				allowNull: false,
				defaultValue: "scheduled",
			},
			notes: { type: DataTypes.TEXT, allowNull: true },
			google_event_id: { type: DataTypes.STRING, allowNull: true },
			createdAt: { type: DataTypes.DATE, allowNull: false },
			updatedAt: { type: DataTypes.DATE, allowNull: false },
		},
		IF_NOT_EXISTS,
	);

	await queryInterface.createTable(
		"Documents",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			title: { type: DataTypes.STRING, allowNull: false },
			category: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: "autre",
			},
			file_url: { type: DataTypes.STRING, allowNull: false },
			file_name: { type: DataTypes.STRING, allowNull: true },
			file_size: { type: DataTypes.INTEGER, allowNull: true },
			mime_type: { type: DataTypes.STRING, allowNull: true },
			entity_type: { type: DataTypes.STRING, allowNull: false },
			entity_id: { type: DataTypes.INTEGER, allowNull: false },
			notes: { type: DataTypes.TEXT, allowNull: true },
			createdAt: { type: DataTypes.DATE, allowNull: false },
			updatedAt: { type: DataTypes.DATE, allowNull: false },
		},
		IF_NOT_EXISTS,
	);

	await queryInterface.createTable(
		"processed_emails",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			message_id: { type: DataTypes.STRING, allowNull: false, unique: true },
			processed_at: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
		},
		IF_NOT_EXISTS,
	);

	await queryInterface.createTable(
		"notifications",
		{
			id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
			type: {
				type: DataTypes.ENUM("matera_charge", "email_sent"),
				allowNull: false,
			},
			title: { type: DataTypes.STRING, allowNull: false },
			message: { type: DataTypes.STRING, allowNull: true },
			is_read: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			metadata: { type: DataTypes.JSON, allowNull: true },
			createdAt: { type: DataTypes.DATE, allowNull: false },
		},
		IF_NOT_EXISTS,
	);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
	if (process.env.NODE_ENV === "production") {
		console.warn("Baseline migration down() skipped in production.");
		return;
	}
	// Drop dans l'ordre inverse des dépendances FK
	await queryInterface.dropTable("notifications");
	await queryInterface.dropTable("processed_emails");
	await queryInterface.dropTable("Documents");
	await queryInterface.dropTable("Visits");
	await queryInterface.dropTable("Inspections");
	await queryInterface.dropTable("Quittances");
	await queryInterface.dropTable("Charges");
	await queryInterface.dropTable("Payments");
	await queryInterface.dropTable("Leases");
	await queryInterface.dropTable("Tenants");
	await queryInterface.dropTable("OwnerConfigs");
	await queryInterface.dropTable("Associates");
	await queryInterface.dropTable("Properties");
	await queryInterface.dropTable("Users");
}
