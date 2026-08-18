import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";
import { createAuditMiddleware } from "@/audit";

const connectionString = `${process.env.DATABASE_URL}`;

// Supavisor gives this whole environment a shared budget of ~20 Postgres
// connections. With two persistent environments (main + dev) each running
// one process, an unbounded pool (node-postgres defaults to 10) leaves zero
// headroom for anything else once both are up. Keep each process's pool
// small and tunable via env instead.
const POOL_MAX = Number(process.env.DATABASE_POOL_MAX ?? 6);

// Supavisor is a transaction-mode pooler: it doesn't guarantee the same
// physical connection across statements, so Prisma's prepared statements
// need to be disabled via pgbouncer=true. Set it in code so it's guaranteed
// regardless of what each environment's DATABASE_URL secret has configured.
function withPgBouncerParam(rawUrl: string): string {
	const url = new URL(rawUrl);
	if (!url.searchParams.has("pgbouncer")) {
		url.searchParams.set("pgbouncer", "true");
	}
	return url.toString();
}

function createPrisma() {
	const adapter = new PrismaPg({
		connectionString: withPgBouncerParam(connectionString),
		max: POOL_MAX,
	});
	const prismaClient = new PrismaClient({ adapter });
	process.on("SIGTERM", () => void prismaClient.$disconnect());
	process.on("SIGINT", () => void prismaClient.$disconnect());
	return prismaClient.$extends(createAuditMiddleware(prismaClient));
}

// Reuse a single client (and its pool) across module reloads, e.g. dev
// hot-reload — otherwise every reload would open a new pool on top of the
// previous one.
const globalForPrisma = globalThis as unknown as {
	prisma?: ReturnType<typeof createPrisma>;
};

const prisma = globalForPrisma.prisma ?? createPrisma();
globalForPrisma.prisma = prisma;

export { prisma };
