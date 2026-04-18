import fs from "node:fs";
import path from "node:path";

const name = process.argv[2];
if (!name) {
	console.error("Usage: npm run migrate:create <migration_name>");
	process.exit(1);
}

const now = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const timestamp = [
	now.getFullYear(),
	pad(now.getMonth() + 1),
	pad(now.getDate()),
	"_",
	pad(now.getHours()),
	pad(now.getMinutes()),
	pad(now.getSeconds()),
].join("");

const filename = `${timestamp}_${name}.ts`;
const migrationsDir = path.join(__dirname, "..", "src", "migrations");
const filePath = path.join(migrationsDir, filename);

fs.writeFileSync(
	filePath,
	`import { QueryInterface, DataTypes } from 'sequelize'

export async function up(queryInterface: QueryInterface): Promise<void> {
  // TODO: implement migration
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // TODO: implement rollback
}
`,
	"utf8",
);

console.log(`Created migration: src/migrations/${filename}`);
