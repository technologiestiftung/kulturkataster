import { Prisma } from "@/generated/prisma";
import { prisma } from "@/server/prisma";

export const entityAuditRepo = {
	list: (where?: Prisma.EntityAuditWhereInput, take = 200) =>
		prisma.entityAudit.findMany({
			where,
			take,
			orderBy: { changed_at: "desc" },
			include: { user: true },
		}),
	listByCorrelationIds: (correlationIds: string[], take = 200) =>
		prisma.entityAudit.findMany({
			where: {
				OR: correlationIds.map((correlationId) => ({
					meta_info: {
						path: ["correlation_id"],
						equals: correlationId,
					},
				})),
			},
			take,
			orderBy: { changed_at: "desc" },
			include: { user: true },
		}),
};
