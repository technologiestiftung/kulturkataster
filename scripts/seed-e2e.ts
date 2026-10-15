// Seeds a local Supabase (auth) + Postgres with synthetic data for the e2e suite.
// All people, emails and institutions are invented — never copy real data here.
// The seed wipes the tables it fills, so it only runs against localhost.
// Usage: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… DATABASE_URL=… npm run seed:e2e
import fs from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient, type Action } from "../src/generated/prisma";
import { INSTITUTION_PERMISSION_FIELDS } from "../src/types/institution";

const PASSWORD = "E2e-Password-123!";
const EMAIL_DOMAIN = "@example.test";
const INSTITUTION_COUNT = 120; // list-view-selection.spec needs ids 5 and 30 and a long list

const USERS = {
	user: { email: `user${EMAIL_DOMAIN}`, first: "Erika", last: "Beispiel" },
	admin: { email: `admin${EMAIL_DOMAIN}`, first: "Max", last: "Muster" },
	banned: { email: `banned${EMAIL_DOMAIN}`, first: "Bernd", last: "Gesperrt" },
} as const;

const ALL_ACTIONS: Action[] = [
	"read",
	"create",
	"update",
	"delete",
	"download",
];
const ADMIN_TABLES = [
	"institution",
	"submission",
	"entity_audit",
	"user",
	"group",
	"role",
	"address",
	"category",
	"answer",
];
const PUBLIC_FIELDS = [
	"status",
	"id",
	"name",
	"address.street",
	"address.zipcode",
	"address.city",
	"address.district",
	"address.lat",
	"address.lng",
	"categories",
	"subcategories",
	"utilization_status",
];

const KINDS = [
	"Atelierhaus",
	"Kulturzentrum",
	"Galerie",
	"Theaterraum",
	"Musikschule",
	"Stadtteilbibliothek",
	"Tanzstudio",
	"Projektraum",
];
const PLACES = [
	"am Kanal",
	"Nord",
	"am Park",
	"Mitte",
	"an der Spree",
	"am Markt",
];
const DISTRICTS = ["Mitte", "Pankow", "Neukölln", "Lichtenberg", "Spandau"];

const requireEnv = (name: string) => {
	const value = process.env[name];
	if (!value) throw new Error(`Missing ${name}`);
	return value;
};

const assertLocal = (name: string, url: string) => {
	const host = new URL(url).hostname;
	if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
		throw new Error(
			`Refusing to seed: ${name} points to ${host}, not localhost.`,
		);
	}
};

const supabaseUrl = requireEnv("SUPABASE_URL");
const databaseUrl = requireEnv("DATABASE_URL");
assertLocal("SUPABASE_URL", supabaseUrl);
assertLocal("DATABASE_URL", databaseUrl);

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: databaseUrl }),
});
const supabase = createClient(
	supabaseUrl,
	requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
	{
		auth: { persistSession: false, autoRefreshToken: false },
	},
);

const resetDatabase = async () => {
	// CASCADE also clears join tables, audits, answers and notes
	await prisma.$executeRawUnsafe(
		`TRUNCATE "user", "role", "group", "institution", "address", "submission", "entity_audit" RESTART IDENTITY CASCADE`,
	);
};

const resetAuthUsers = async () => {
	const { data, error } = await supabase.auth.admin.listUsers({
		perPage: 1000,
	});
	if (error) throw error;
	// Also removes users the tests created (register, invite)
	const seeded = data.users.filter((u) => u.email?.endsWith(EMAIL_DOMAIN));
	for (const user of seeded) {
		const { error: deleteError } = await supabase.auth.admin.deleteUser(
			user.id,
		);
		if (deleteError) throw deleteError;
	}
};

const createAuthUser = async (email: string) => {
	const { data, error } = await supabase.auth.admin.createUser({
		email,
		password: PASSWORD,
		email_confirm: true,
	});
	if (error) throw error;
	return data.user.id;
};

const fieldPermissions = (fields: readonly string[], actions: Action[]) =>
	fields.flatMap((field) =>
		actions.map((action) => ({ table: "institution", field, action })),
	);

const seedRoles = async () => {
	const guest = await prisma.role.create({
		data: {
			name: "Gast",
			is_guest: true,
			is_system: true,
			table_permissions: {
				create: ["institution", "category", "address"].map((table) => ({
					table,
					action: "read" as const,
				})),
			},
			field_permissions: {
				create: fieldPermissions(PUBLIC_FIELDS, ["read", "download"]),
			},
		},
	});

	const member = await prisma.role.create({
		data: {
			name: "Mitglied",
			table_permissions: {
				create: [
					{ table: "entity_audit", action: "read" as const },
					{ table: "institution", action: "read" as const },
					{ table: "institution", action: "update" as const },
					{ table: "category", action: "read" as const },
					{ table: "address", action: "read" as const },
					...(["create", "read", "update", "delete"] as const).map(
						(action) => ({
							table: "submission",
							action,
						}),
					),
				],
			},
			field_permissions: {
				create: fieldPermissions(INSTITUTION_PERMISSION_FIELDS, [
					"read",
					"update",
				]),
			},
		},
	});

	const admin = await prisma.role.create({
		data: {
			name: "Administration",
			is_system: true,
			table_permissions: {
				create: ADMIN_TABLES.flatMap((table) =>
					ALL_ACTIONS.map((action) => ({
						table,
						action,
						scope: "all" as const,
					})),
				),
			},
			field_permissions: {
				create: fieldPermissions(INSTITUTION_PERMISSION_FIELDS, ALL_ACTIONS),
			},
		},
	});

	return { guest, member, admin };
};

const seedUsers = async (roles: Awaited<ReturnType<typeof seedRoles>>) => {
	const create = async (
		key: keyof typeof USERS,
		roleId: number,
		status: "active" | "banned",
	) => {
		const { email, first, last } = USERS[key];
		// Prisma user.id must equal the Supabase auth user id
		const id = await createAuthUser(email);
		await prisma.user.create({
			data: {
				id,
				email,
				first_name: first,
				last_name: last,
				role_id: roleId,
				status,
			},
		});
		return id;
	};

	return {
		userId: await create("user", roles.member.id, "active"),
		adminId: await create("admin", roles.admin.id, "active"),
		// Banned only in Prisma; a Supabase ban would fail sign-in before the app check
		bannedId: await create("banned", roles.member.id, "banned"),
	};
};

const institutionName = (i: number) =>
	`${KINDS[i % KINDS.length]} ${PLACES[i % PLACES.length]} ${i}`;

const seedInstitutions = async (userId: string) => {
	// Ids run 1..INSTITUTION_COUNT because resetDatabase restarts the sequence
	for (let i = 1; i <= INSTITUTION_COUNT; i++) {
		await prisma.institution.create({
			data: {
				name: institutionName(i),
				status: "public",
				utilization_status: "in_use",
				address: {
					create: {
						street: "Teststraße",
						street_number: String(i),
						zipcode: String(10115 + (i % 50)),
						city: "Berlin",
						district: DISTRICTS[i % DISTRICTS.length],
						// Deterministic spread inside the Berlin bounding box
						lat: 52.4 + ((i * 37) % 100) * 0.002,
						lng: 13.2 + ((i * 53) % 100) * 0.004,
					},
				},
				// Institution 1 belongs to the e2e user (edit-routing.spec)
				...(i === 1 && { users: { connect: { id: userId } } }),
			},
		});
	}
};

const seedSubmissions = async (userId: string) => {
	// Draft the e2e user can edit (E2E_SUBMISSION_ID)
	const draft = await prisma.submission.create({
		data: {
			entity_type: "institution",
			type: "create",
			status: "draft",
			created_by: userId,
			data: { name: "Entwurf Kulturort" },
		},
	});
	// Pending create request for submissions-review.spec
	await prisma.submission.create({
		data: {
			entity_type: "institution",
			type: "create",
			status: "approval_pending",
			created_by: userId,
			data: { name: "Neuer Kulturort zur Prüfung" },
		},
	});
	return draft.id;
};

// Prints shell exports (`eval "$(npm run -s seed:e2e)"`) and, in CI, fills $GITHUB_ENV
const writeE2eEnv = (values: Record<string, string>) => {
	const entries = Object.entries(values);
	console.log(
		entries.map(([key, value]) => `export ${key}='${value}'`).join("\n"),
	);
	if (process.env.GITHUB_ENV) {
		const lines = entries.map(([key, value]) => `${key}=${value}`).join("\n");
		fs.appendFileSync(process.env.GITHUB_ENV, `${lines}\n`);
	}
};

const main = async () => {
	await resetDatabase();
	await resetAuthUsers();
	const roles = await seedRoles();
	const { userId } = await seedUsers(roles);
	await seedInstitutions(userId);
	const submissionId = await seedSubmissions(userId);

	writeE2eEnv({
		E2E_USER_EMAIL: USERS.user.email,
		E2E_USER_PASSWORD: PASSWORD,
		E2E_ADMIN_EMAIL: USERS.admin.email,
		E2E_ADMIN_PASSWORD: PASSWORD,
		E2E_BANNED_USER_EMAIL: USERS.banned.email,
		E2E_BANNED_USER_PASSWORD: PASSWORD,
		E2E_REGISTER_EMAIL: `register${EMAIL_DOMAIN}`,
		E2E_REGISTER_PASSWORD: PASSWORD,
		E2E_RESET_EMAIL: `reset${EMAIL_DOMAIN}`,
		E2E_INSTITUTION_ID: "1",
		E2E_INSTITUTION_NAME: institutionName(1),
		E2E_SUBMISSION_ID: String(submissionId),
	});
};

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
