import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const sqlFile = process.argv[2];
if (!sqlFile) {
	console.error("Usage: npm run migrate:owner-config-table <path-to-sql-file>");
	process.exit(1);
}

const sqlPath = path.resolve(sqlFile);
if (!fs.existsSync(sqlPath)) {
	console.error(`File not found: ${sqlPath}`);
	process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");

const client = new Client({
	host: process.env.DATABASE_HOST || "localhost",
	user: process.env.DATABASE_USER || "postgres",
	password: process.env.DATABASE_PASSWORD,
	database: "sci",
	port: Number.parseInt(process.env.DATABASE_PORT || "5432", 10),
});

async function run() {
	await client.connect();
	console.log(`Running SQL migration: ${sqlFile}`);
	try {
		await client.query(sql);
		console.log("SQL migration completed successfully.");
	} finally {
		await client.end();
	}
}

run().catch((err) => {
	console.error("SQL migration failed:", err.message);
	process.exit(1);
});
