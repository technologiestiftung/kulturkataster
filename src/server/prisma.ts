import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";
import { createAuditMiddleware } from "@/audit";

const connectionString = `${process.env.DATABASE_URL}`;

// Supavisor stellt der ganzen Umgebung nur 20 Postgres-Verbindungen bereit.
// Ein einzelnes Frontend darf sie nicht alle belegen. Ohne diesen Wert nimmt
// node-postgres seinen Default von 10.
const MAX_CONNECTIONS = 8;

function createPrisma() {
	const adapter = new PrismaPg({ connectionString, max: MAX_CONNECTIONS });
	const prismaClient = new PrismaClient({ adapter });
	return prismaClient.$extends(createAuditMiddleware(prismaClient));
}

// Next.js lädt dieses Modul mehr als einmal pro Container: einmal je
// Server-Bundle, und in der Entwicklung zusätzlich bei jedem Hot Reload.
// Jeder Ladevorgang würde einen eigenen Verbindungspool aufbauen, und die
// Pools addieren sich, bis Supavisor keine Clients mehr annimmt.
// Der Cache auf globalThis sorgt für genau einen Pool pro Prozess.
const globalForPrisma = globalThis as unknown as {
	prisma?: ReturnType<typeof createPrisma>;
};

const prisma = globalForPrisma.prisma ?? createPrisma();
globalForPrisma.prisma = prisma;

export { prisma };
