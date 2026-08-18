import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";
import { createAuditMiddleware } from "@/audit";

const connectionString = `${process.env.DATABASE_URL}`;

// Supavisor's session-mode pooler pins one Postgres backend connection per
// client connection for the connection's whole lifetime. Bound the pool so
// this process never claims more than its fair share of that budget.
const POOL_MAX = 50;

const adapter = new PrismaPg({ connectionString, max: POOL_MAX });
const prismaClient = new PrismaClient({ adapter });
const prisma = prismaClient.$extends(createAuditMiddleware(prismaClient));

// Release session-mode connections on shutdown instead of leaving them
// stuck until Supavisor's idle timeout, so redeploys don't accumulate
// orphaned connections against the pooler's limit.
process.on("SIGTERM", () => void prismaClient.$disconnect());
process.on("SIGINT", () => void prismaClient.$disconnect());

export { prisma };
