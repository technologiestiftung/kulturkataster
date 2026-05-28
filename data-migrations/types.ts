import type { Prisma, PrismaClient } from "../src/generated/prisma";

export type DataMigrationClient = PrismaClient | Prisma.TransactionClient;

export interface DataMigrationModule {
	id?: string;
	transactional?: boolean;
	up: (prisma: DataMigrationClient) => Promise<void>;
}
