import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma";
import type {
	DataMigrationClient,
	DataMigrationModule,
} from "../data-migrations/types";

const MIGRATION_FILENAME_PATTERN = /^\d{12}.*\.(sql|ts)$/;

type LoadedMigration = {
	filename: string;
	id: string;
	transactional: boolean;
	up: (client: DataMigrationClient) => Promise<void>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataMigrationsDir = path.resolve(__dirname, "..", "data-migrations");

const usage = `Usage: tsx scripts/run-data-migrations.ts [--dry-run]

Options:
  --dry-run   List discovered migrations without executing them
  --help      Show this help text`;

const loadSqlMigration = async (
	absolutePath: string,
	filename: string,
): Promise<LoadedMigration> => {
	const sql = (await fs.readFile(absolutePath, "utf8"))
		.replace(/^\s*BEGIN;\s*/i, "")
		.replace(/\s*COMMIT;\s*$/i, "")
		.trim();

	if (!sql) {
		throw new Error(`SQL migration ${filename} is empty`);
	}

	return {
		filename,
		id: path.basename(filename, ".sql"),
		transactional: true,
		up: async (client) => {
			await client.$executeRawUnsafe(sql);
		},
	};
};

const loadTypeScriptMigration = async (
	absolutePath: string,
	filename: string,
): Promise<LoadedMigration> => {
	const moduleUrl = pathToFileURL(absolutePath).href;
	const loadedModule = (await import(moduleUrl)) as DataMigrationModule;

	if (typeof loadedModule.up !== "function") {
		throw new Error(
			`TypeScript migration ${filename} must export an up() function`,
		);
	}

	const id = loadedModule.id ?? path.basename(filename, ".ts");
	if (!id) {
		throw new Error(`TypeScript migration ${filename} must define a valid id`);
	}

	return {
		filename,
		id,
		transactional: loadedModule.transactional !== false,
		up: loadedModule.up,
	};
};

const loadMigration = async (
	absolutePath: string,
	filename: string,
): Promise<LoadedMigration> => {
	if (filename.endsWith(".sql")) {
		return loadSqlMigration(absolutePath, filename);
	}
	if (filename.endsWith(".ts")) {
		return loadTypeScriptMigration(absolutePath, filename);
	}

	throw new Error(`Unsupported data migration file: ${filename}`);
};

const discoverMigrations = async (): Promise<LoadedMigration[]> => {
	const entries = await fs.readdir(dataMigrationsDir, { withFileTypes: true });
	const migrationFiles = entries
		.filter(
			(entry) => entry.isFile() && MIGRATION_FILENAME_PATTERN.test(entry.name),
		)
		.map((entry) => entry.name)
		.sort((left, right) => left.localeCompare(right));

	return Promise.all(
		migrationFiles.map((filename) =>
			loadMigration(path.join(dataMigrationsDir, filename), filename),
		),
	);
};

const hasMigrationRun = async (
	client: DataMigrationClient,
	id: string,
): Promise<boolean> => {
	const rows = await client.$queryRaw<Array<{ id: string }>>(
		Prisma.sql`SELECT id FROM app_data_migrations WHERE id = ${id} LIMIT 1`,
	);
	return rows.length > 0;
};

const markMigrationRun = async (client: DataMigrationClient, id: string) => {
	await client.$executeRaw(
		Prisma.sql`INSERT INTO app_data_migrations (id) VALUES (${id})`,
	);
};

const runMigration = async (
	prisma: PrismaClient,
	migration: LoadedMigration,
): Promise<"applied" | "skipped"> => {
	if (migration.transactional) {
		return prisma.$transaction(async (tx) => {
			if (await hasMigrationRun(tx, migration.id)) {
				return "skipped";
			}
			await migration.up(tx);
			await markMigrationRun(tx, migration.id);
			return "applied";
		});
	}

	if (await hasMigrationRun(prisma, migration.id)) {
		return "skipped";
	}
	await migration.up(prisma);
	await markMigrationRun(prisma, migration.id);
	return "applied";
};

const main = async () => {
	if (process.argv.includes("--help")) {
		console.log(usage);
		return;
	}

	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL is required to run data migrations");
	}

	const migrations = await discoverMigrations();
	if (process.argv.includes("--dry-run")) {
		if (migrations.length === 0) {
			console.log("No data migrations found.");
			return;
		}

		console.log("Discovered data migrations:");
		for (const migration of migrations) {
			console.log(`- ${migration.id}`);
		}
		return;
	}

	if (migrations.length === 0) {
		console.log("No data migrations to run.");
		return;
	}

	const adapter = new PrismaPg({ connectionString });
	const prisma = new PrismaClient({ adapter });

	try {
		for (const migration of migrations) {
			const result = await runMigration(prisma, migration);
			console.log(
				`${result === "applied" ? "applied" : "skipped"} ${migration.id}`,
			);
		}
	} finally {
		await prisma.$disconnect();
	}
};

main().catch((error) => {
	console.error(
		error instanceof Error ? error.message : "Unknown data migration error",
	);
	process.exit(1);
});
