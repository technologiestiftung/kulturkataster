import { PrismaClient } from "@/generated/prisma";
import { createAuditMiddleware } from "./middleware/auditMiddleware";

const prismaClientSingleton = () => {
	const client = new PrismaClient({
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
	});

	// Apply audit middleware
	return client.$extends(createAuditMiddleware(client));
};

declare const globalThis: {
	prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
