"use server";

import { Prisma } from "@/generated/prisma";
import { getCurrentUserId } from "@/server/actions/auth";
import { entityAuditRepo } from "@/server/data/entityAuditRepo";
import {
	authorizeTable,
	getAccessContextForUser,
	getTableScope,
	requireScopeOrUser,
} from "@/server/utils/rbac";
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";
import { logger } from "@/server/logging/logger";

type EntityAuditRow = Prisma.EntityAuditGetPayload<{ include: { user: true } }>;

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

export async function getEntityAudits() {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "entity_audit", "read");
			const scope = getTableScope(ctx, "entity_audit", "read");
			const ownerId = requireScopeOrUser(
				scope,
				currentUserId,
				"User must be authenticated to access activity logs.",
			);
			if (!ownerId) {
				try {
					return await entityAuditRepo.list();
				} catch (error) {
					logger.error("entity_audit.list.db_failed", error, {
						subsystem: "audit",
						db_subsystem: "db",
						actor_user_id: currentUserId,
					});
					throw error;
				}
			}

			let ownAudits;
			try {
				ownAudits = await entityAuditRepo.list({ changed_by: ownerId });
			} catch (error) {
				logger.error("entity_audit.list_own.db_failed", error, {
					subsystem: "audit",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					target_user_id: ownerId,
				});
				throw error;
			}
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

			let relatedAudits;
			try {
				relatedAudits =
					await entityAuditRepo.listByCorrelationIds(correlationIds);
			} catch (error) {
				logger.error("entity_audit.list_related.db_failed", error, {
					subsystem: "audit",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					target_user_id: ownerId,
					correlation_ids_count: correlationIds.length,
				});
				throw error;
			}
			const merged = new Map<number, EntityAuditRow>();
			for (const audit of [...ownAudits, ...relatedAudits]) {
				merged.set(audit.id, audit);
			}

			return Array.from(merged.values())
				.map((audit) =>
					audit.changed_by === ownerId ? audit : redactForeignAudit(audit),
				)
				.sort((a, b) => b.changed_at.getTime() - a.changed_at.getTime());
		},
		{ route: "server_action:entityAudits.getEntityAudits" },
	);
}
