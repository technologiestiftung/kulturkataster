import { Prisma } from "@/generated/prisma";
import { prisma } from "@/server/prisma";
import { getAuditContext } from "@/server/utils/auditContext";
import type { SubmissionAuditStatusUpdateInput } from "@/types/submission";

const asObject = (value: unknown): Record<string, unknown> | null =>
	typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

const mergeAuditMeta = (
	existing: Prisma.JsonValue | null | undefined,
	next: Record<string, unknown>,
): Prisma.InputJsonValue =>
	({
		...(asObject(existing) ?? {}),
		...next,
	}) as Prisma.InputJsonValue;

type EntityAuditDb = {
	entityAudit: {
		findMany: (args: {
			where: Prisma.EntityAuditWhereInput;
			select: { id: true; meta_info: true };
		}) => Promise<Array<{ id: number; meta_info: Prisma.JsonValue | null }>>;
		update: (args: {
			where: { id: number };
			data: Prisma.EntityAuditUpdateInput;
		}) => Promise<unknown>;
	};
};

export async function updateSubmissionAuditStatus(
	params: SubmissionAuditStatusUpdateInput,
	db: EntityAuditDb = prisma as EntityAuditDb,
) {
	const auditContext = getAuditContext();
	const audits = await db.entityAudit.findMany({
		where: {
			entity_type: "submission",
			entity_id: String(params.submissionId),
			status: "approval_pending",
		},
		select: { id: true, meta_info: true },
	});
	if (audits.length === 0) return;

	const reviewedAt = new Date().toISOString();
	await Promise.all(
		audits.map((audit) =>
			db.entityAudit.update({
				where: { id: audit.id },
				data: {
					status: params.status,
					meta_info: mergeAuditMeta(audit.meta_info, {
						correlation_id: auditContext?.correlationId ?? null,
						root_entity_type: auditContext?.rootEntityType ?? null,
						root_entity_id: auditContext?.rootEntityId ?? null,
						intent: auditContext?.intent ?? null,
						reviewed_at: reviewedAt,
						reviewed_by: params.reviewerId,
						review_notes: params.reviewNotes ?? null,
					}),
				},
			}),
		),
	);
}
