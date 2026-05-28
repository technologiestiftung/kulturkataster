import { Prisma } from "@/generated/prisma";
import { prisma } from "@/server/prisma";

export type EntityAuditCursor = {
	changedAt: Date;
	id: number;
};

type EntityAuditListArgs = {
	where?: Prisma.EntityAuditWhereInput;
	take?: number;
	before?: EntityAuditCursor;
};

const buildBeforeWhere = (
	before?: EntityAuditCursor,
): Prisma.EntityAuditWhereInput | undefined => {
	if (!before) return undefined;
	return {
		OR: [
			{ changed_at: { lt: before.changedAt } },
			{
				AND: [
					{ changed_at: { equals: before.changedAt } },
					{ id: { lt: before.id } },
				],
			},
		],
	};
};

const mergeWhere = (
	where?: Prisma.EntityAuditWhereInput,
	before?: EntityAuditCursor,
): Prisma.EntityAuditWhereInput | undefined => {
	const beforeWhere = buildBeforeWhere(before);
	if (!where) return beforeWhere;
	if (!beforeWhere) return where;
	return {
		AND: [where, beforeWhere],
	};
};

export const entityAuditRepo = {
	list: ({ where, take = 200, before }: EntityAuditListArgs = {}) =>
		prisma.entityAudit.findMany({
			where: mergeWhere(where, before),
			take,
			orderBy: [{ changed_at: "desc" }, { id: "desc" }],
			include: { user: true },
		}),
	listByCorrelationIds: (
		correlationIds: string[],
		{ take, before }: Omit<EntityAuditListArgs, "where"> = {},
	) =>
		prisma.entityAudit.findMany({
			where: mergeWhere(
				{
					OR: correlationIds.map((correlationId) => ({
						meta_info: {
							path: ["correlation_id"],
							equals: correlationId,
						},
					})),
				},
				before,
			),
			take,
			orderBy: [{ changed_at: "desc" }, { id: "desc" }],
			include: { user: true },
		}),
};
