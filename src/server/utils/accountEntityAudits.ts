import { Prisma } from "@/generated/prisma";
import {
	entityAuditRepo,
	type EntityAuditCursor,
} from "@/server/data/entityAuditRepo";
import {
	canTable,
	getTableScope,
	requireScopeOrUser,
	type AccessContext,
} from "@/server/utils/rbac";
import type { AccountStoreState } from "@/types/account";

type EntityAuditRow = Awaited<ReturnType<typeof entityAuditRepo.list>>[number];
export const DEFAULT_ACCOUNT_ENTITY_AUDIT_PAGE_SIZE = 200;

type LoadAccountEntityAuditsPageOptions = {
	take?: number;
	before?: EntityAuditCursor;
};

export type AccountEntityAuditsPage = {
	audits: AccountStoreState["entityAudits"];
	hasMore: boolean;
};

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

const redactAuditsNotChangedByOwner = (
	audits: EntityAuditRow[],
	ownerId: string | null,
) => {
	if (!ownerId) {
		return audits;
	}

	return audits.map((audit) =>
		audit.changed_by === ownerId ? audit : redactForeignAudit(audit),
	);
};

export async function loadAccountEntityAudits(args: {
	ctx: AccessContext;
	currentUserId: string | null;
}): Promise<AccountStoreState["entityAudits"]> {
	const result = await loadAccountEntityAuditsPage(args);
	return result.audits;
}

export async function loadAccountEntityAuditsPage(
	args: {
		ctx: AccessContext;
		currentUserId: string | null;
	},
	options: LoadAccountEntityAuditsPageOptions = {},
): Promise<AccountEntityAuditsPage> {
	const { ctx, currentUserId } = args;
	const take = options.take ?? DEFAULT_ACCOUNT_ENTITY_AUDIT_PAGE_SIZE;
	const fetchTake = take + 1;

	if (!canTable(ctx, "entity_audit", "read")) {
		return {
			audits: [],
			hasMore: false,
		};
	}

	const scope = getTableScope(ctx, "entity_audit", "read");
	const ownerId = requireScopeOrUser(
		scope,
		currentUserId,
		"User must be authenticated to access activity logs.",
	);
	if (!ownerId) {
		const audits = await entityAuditRepo.list({
			before: options.before,
			take: fetchTake,
		});
		return {
			audits: audits.slice(0, take),
			hasMore: audits.length > take,
		};
	}

	const ownAudits = await entityAuditRepo.list({
		where: {
			OR: [
				{ changed_by: ownerId },
				{ entity_type: "user", entity_id: ownerId },
			],
		},
		before: options.before,
		take: fetchTake,
	});
	const hasMore = ownAudits.length > take;
	const pageOwnAudits = ownAudits.slice(0, take);
	const correlationIds = Array.from(
		new Set(
			pageOwnAudits
				.map((audit) => getCorrelationId(audit.meta_info))
				.filter((correlationId): correlationId is string =>
					Boolean(correlationId),
				),
		),
	);

	if (correlationIds.length === 0) {
		return {
			audits: redactAuditsNotChangedByOwner(pageOwnAudits, ownerId),
			hasMore,
		};
	}

	const relatedAudits =
		await entityAuditRepo.listByCorrelationIds(correlationIds);
	const merged = new Map<number, EntityAuditRow>();
	for (const audit of [...pageOwnAudits, ...relatedAudits]) {
		merged.set(audit.id, audit);
	}

	return {
		audits: redactAuditsNotChangedByOwner(
			Array.from(merged.values()),
			ownerId,
		).sort((a, b) => {
			const changedAtDiff = b.changed_at.getTime() - a.changed_at.getTime();
			return changedAtDiff !== 0 ? changedAtDiff : b.id - a.id;
		}),
		hasMore,
	};
}
