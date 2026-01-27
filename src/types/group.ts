import type { Prisma } from "@/generated/prisma";

export type PrismaGroupWithRelations = Prisma.GroupGetPayload<{
	include: {
		users: true;
		institutions: true;
	};
}>;

export type Group = PrismaGroupWithRelations;
