import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";
import { createAuditMiddleware } from "@/audit";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prismaClient = new PrismaClient({ adapter });
const prisma = prismaClient.$extends(createAuditMiddleware(prismaClient));

export { prisma };
