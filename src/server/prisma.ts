import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";
import { createAuditMiddleware } from "@/audit";

const connectionString = `${process.env.DATABASE_URL}`;

// Reuse a single PrismaClient (and its underlying pg.Pool) across module
// reloads. Without this, every dev hot-reload opens a new pool against the
// pooler without closing the old one, quickly exhausting its session-mode
// connection limit.
const globalForPrisma = globalThis as unknown as {
	prismaClient?: PrismaClient;
};

const prismaClient =
	globalForPrisma.prismaClient ??
	new PrismaClient({
		adapter: new PrismaPg({ connectionString, max: 5 }),
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prismaClient = prismaClient;
}

const prisma = prismaClient.$extends(createAuditMiddleware(prismaClient));

export { prisma };
