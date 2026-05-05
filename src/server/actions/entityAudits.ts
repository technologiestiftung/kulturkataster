"use server";

import { getCurrentUserId } from "@/server/actions/auth";
import { type EntityAuditCursor } from "@/server/data/entityAuditRepo";
import { getAccessContextForUser } from "@/server/utils/rbac";
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";
import { logger } from "@/server/logging/logger";
import {
	loadAccountEntityAuditsPage,
	DEFAULT_ACCOUNT_ENTITY_AUDIT_PAGE_SIZE,
} from "@/server/utils/accountEntityAudits";

const MAX_ENTITY_AUDIT_PAGE_SIZE = DEFAULT_ACCOUNT_ENTITY_AUDIT_PAGE_SIZE;

export type GetEntityAuditsPageInput = {
	beforeChangedAt?: string | null;
	beforeId?: number | null;
	take?: number | null;
};

const parseEntityAuditCursor = (
	input?: GetEntityAuditsPageInput,
): EntityAuditCursor | undefined => {
	if (
		!input?.beforeChangedAt ||
		typeof input.beforeId !== "number" ||
		!Number.isFinite(input.beforeId)
	) {
		return undefined;
	}
	const changedAt = new Date(input.beforeChangedAt);
	if (Number.isNaN(changedAt.getTime())) return undefined;
	return {
		changedAt,
		id: input.beforeId,
	};
};

const normalizeTake = (input?: number | null) => {
	if (typeof input !== "number" || !Number.isFinite(input)) {
		return 100;
	}
	return Math.min(MAX_ENTITY_AUDIT_PAGE_SIZE, Math.max(1, Math.floor(input)));
};

export async function getEntityAudits() {
	const result = await getEntityAuditsPage();
	return result.audits;
}

export async function getEntityAuditsPage(input?: GetEntityAuditsPageInput) {
	return runWithServerRequestContext(
		async () => {
			try {
				const currentUserId = await getCurrentUserId();
				setRequestContext({ userId: currentUserId });
				const ctx = await getAccessContextForUser(currentUserId);
				return await loadAccountEntityAuditsPage(
					{
						ctx,
						currentUserId,
					},
					{
						before: parseEntityAuditCursor(input),
						take: normalizeTake(input?.take),
					},
				);
			} catch (error) {
				logger.warn("entity_audit.list.failed", {
					subsystem: "audit",
					error: error instanceof Error ? error.message : String(error),
				});
				return {
					audits: [],
					hasMore: false,
				};
			}
		},
		{ route: "server_action:entityAudits.getEntityAuditsPage" },
	);
}
