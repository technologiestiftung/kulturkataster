import type { Prisma } from "@/generated/prisma";

export type EntityAudit = Prisma.EntityAuditGetPayload<{
	include: { user: true };
}>;
