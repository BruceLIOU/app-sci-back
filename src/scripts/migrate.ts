require("dotenv").config();
import path from "node:path";
import { Sequelize } from "sequelize";
import { SequelizeStorage, Umzug } from "umzug";

const dbConfig = require("../config/db.config");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
	host: dbConfig.HOST,
	dialect: dbConfig.dialect,
	logging: false,
});

const umzug = new Umzug({
	migrations: {
		glob: path.join(__dirname, "../migrations/*.ts"),
		resolve: ({ name, path: migPath, context }) => {
			if (!migPath) {
				throw new Error(`Migration path is missing for ${name}`);
			}
			const migration = require(migPath);
			return {
				name,
				up: async () => migration.up(context),
				down: async () => migration.down(context),
			};
		},
	},
	context: sequelize.getQueryInterface(),
	storage: new SequelizeStorage({ sequelize, tableName: "SequelizeMeta" }),
	logger: console,
});

async function main() {
	const command = process.argv[2];
	if (command === "up") {
		await umzug.up();
	} else if (command === "down") {
		await umzug.down();
	} else if (command === "status") {
		const executed = await umzug.executed();
		const pending = await umzug.pending();
		console.log(
			"Executed:",
			executed.map((m) => m.name),
		);
		console.log(
			"Pending:",
			pending.map((m) => m.name),
		);
	} else {
		console.error(`Unknown command: ${command}. Use: up | down | status`);
		process.exit(1);
	}
	await sequelize.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
