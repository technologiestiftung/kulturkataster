import { Prisma } from "@/generated/prisma";
import { entityAuditRepo } from "@/server/data/entityAuditRepo";
import {
	canTable,
	getTableScope,
	requireScopeOrUser,
	type AccessContext,
} from "@/server/utils/rbac";
import type { AccountStoreState } from "@/types/account";

type EntityAuditRow = Awaited<ReturnType<typeof entityAuditRepo.list>>[number];

const getCorrelationId = (metaInfo: Prisma.JsonValue | null | undefined) => {
	if (!metaInfo || typeof metaInfo !== "object" || Array.isArray(metaInfo)) {
		return null;
	}

	const correlationId = (metaInfo as Prisma.JsonObject).correlation_id;
	return typeof correlationId === "string" && correlationId.trim().length > 0
		? correlationId
		: null;
};

const redactForeignAudit = (audit: EntityAuditRow): EntityAuditRow => {
	const metaInfo = audit.meta_info;
	if (!metaInfo || typeof metaInfo !== "object" || Array.isArray(metaInfo)) {
		return {
			...audit,
			changed_by: null,
			user: null,
		};
	}

	const redactedMetaInfo: Prisma.JsonObject = {
		...(metaInfo as Prisma.JsonObject),
	};
	if ("reviewed_by" in redactedMetaInfo) {
		redactedMetaInfo.reviewed_by = null;
	}
	redactedMetaInfo.actor_hidden = true;

	return {
		...audit,
		changed_by: null,
		user: null,
		meta_info: redactedMetaInfo,
	};
};

export async function loadAccountEntityAudits(args: {
	ctx: AccessContext;
	currentUserId: string;
}): Promise<AccountStoreState["entityAudits"]> {
	const { ctx, currentUserId } = args;

	if (!canTable(ctx, "entity_audit", "read")) return [];

	const scope = getTableScope(ctx, "entity_audit", "read");
	const ownerId = requireScopeOrUser(
		scope,
		currentUserId,
		"User must be authenticated to access activity logs.",
	);
	if (!ownerId) {
		return entityAuditRepo.list();
	}

	const ownAudits = await entityAuditRepo.list({ changed_by: ownerId });
	const correlationIds = Array.from(
		new Set(
			ownAudits
				.map((audit) => getCorrelationId(audit.meta_info))
				.filter((correlationId): correlationId is string =>
					Boolean(correlationId),
				),
		),
	);

	if (correlationIds.length === 0) {
		return ownAudits;
	}

	const relatedAudits =
		await entityAuditRepo.listByCorrelationIds(correlationIds);
	const merged = new Map<number, EntityAuditRow>();
	for (const audit of [...ownAudits, ...relatedAudits]) {
		merged.set(audit.id, audit);
	}

	return Array.from(merged.values())
		.map((audit) =>
			audit.changed_by === ownerId ? audit : redactForeignAudit(audit),
		)
		.sort((a, b) => b.changed_at.getTime() - a.changed_at.getTime());
}
