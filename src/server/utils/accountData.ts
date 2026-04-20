import { Prisma } from "@/generated/prisma";
import { categoryRepo } from "@/server/data/categoryRepo";
import { entityAuditRepo } from "@/server/data/entityAuditRepo";
import { groupRepo } from "@/server/data/groupRepo";
import { institutionRepo } from "@/server/data/institutionRepo";
import { roleRepo } from "@/server/data/roleRepo";
import { submissionRepo } from "@/server/data/submissionRepo";
import { userRepo } from "@/server/data/userRepo";
import { buildInstitutionScopedWhere } from "@/server/logic/institutionAccess";
import { buildInstitutionSelect } from "@/server/logic/institutionSelect";
import {
	canTable,
	getTableScope,
	requireScopeOrUser,
	type AccessContext,
} from "@/server/utils/rbac";

export type AccountDataPayload = {
	users: Awaited<ReturnType<typeof userRepo.list>> | Awaited<ReturnType<typeof userRepo.findById>>[];
	groups: Awaited<ReturnType<typeof groupRepo.list>>;
	roles: Awaited<ReturnType<typeof roleRepo.list>>;
	categories: Awaited<ReturnType<typeof categoryRepo.listAll>>;
	institutions: Awaited<ReturnType<typeof institutionRepo.listWithSelect>>;
	submissions: Awaited<ReturnType<typeof submissionRepo.list>>;
	entityAudits: Awaited<ReturnType<typeof entityAuditRepo.list>>;
};

type EntityAuditRow = Awaited<ReturnType<typeof entityAuditRepo.list>>[number];

type AccountDataLoaderArgs = {
	ctx: AccessContext;
	currentUserId: string;
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

const loadUsers = async ({
	ctx,
	currentUserId,
}: AccountDataLoaderArgs): Promise<AccountDataPayload["users"]> => {
	if (!canTable(ctx, "user", "read")) return [];

	const scope = getTableScope(ctx, "user", "read");
	if (scope === "all") {
		return userRepo.list();
	}

	const user = await userRepo.findById(currentUserId);
	return user ? [user] : [];
};

const loadGroups = async ({
	ctx,
}: AccountDataLoaderArgs): Promise<AccountDataPayload["groups"]> => {
	if (!canTable(ctx, "group", "read")) return [];
	if (getTableScope(ctx, "group", "read") !== "all") return [];
	return groupRepo.list();
};

const loadRoles = async ({
	ctx,
}: AccountDataLoaderArgs): Promise<AccountDataPayload["roles"]> => {
	if (!canTable(ctx, "role", "read")) return [];
	if (getTableScope(ctx, "role", "read") !== "all") return [];
	return roleRepo.list();
};

const loadCategories = async ({
	ctx,
}: AccountDataLoaderArgs): Promise<AccountDataPayload["categories"]> => {
	if (!canTable(ctx, "category", "update")) return [];
	return categoryRepo.listAll();
};

const loadInstitutions = async ({
	ctx,
	currentUserId,
}: AccountDataLoaderArgs): Promise<AccountDataPayload["institutions"]> => {
	if (!canTable(ctx, "institution", "read")) return [];

	const select = buildInstitutionSelect(ctx);
	if (!select) return [];

	const scope = getTableScope(ctx, "institution", "read");
	if (scope === "all") {
		return institutionRepo.listWithSelect(select);
	}

	const where = buildInstitutionScopedWhere(scope, currentUserId);
	if (!where) return [];
	return institutionRepo.listWithSelectWhere(where, select);
};

const loadSubmissions = async ({
	ctx,
	currentUserId,
}: AccountDataLoaderArgs): Promise<AccountDataPayload["submissions"]> => {
	if (!canTable(ctx, "submission", "read")) return [];

	const scope = getTableScope(ctx, "submission", "read");
	const ownerId = requireScopeOrUser(scope, currentUserId);
	return submissionRepo.list({
		created_by: ownerId ? ownerId : undefined,
	});
};

const loadEntityAudits = async ({
	ctx,
	currentUserId,
}: AccountDataLoaderArgs): Promise<AccountDataPayload["entityAudits"]> => {
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
};

const ACCOUNT_DATA_LOADERS = {
	users: loadUsers,
	groups: loadGroups,
	roles: loadRoles,
	categories: loadCategories,
	institutions: loadInstitutions,
	submissions: loadSubmissions,
	entityAudits: loadEntityAudits,
} satisfies {
	[K in keyof AccountDataPayload]: (
		args: AccountDataLoaderArgs,
	) => Promise<AccountDataPayload[K]>;
};

export async function loadAccountData(
	args: AccountDataLoaderArgs,
): Promise<AccountDataPayload> {
	const [
		users,
		groups,
		roles,
		categories,
		institutions,
		submissions,
		entityAudits,
	] = await Promise.all([
		ACCOUNT_DATA_LOADERS.users(args),
		ACCOUNT_DATA_LOADERS.groups(args),
		ACCOUNT_DATA_LOADERS.roles(args),
		ACCOUNT_DATA_LOADERS.categories(args),
		ACCOUNT_DATA_LOADERS.institutions(args),
		ACCOUNT_DATA_LOADERS.submissions(args),
		ACCOUNT_DATA_LOADERS.entityAudits(args),
	]);

	return {
		users,
		groups,
		roles,
		categories,
		institutions,
		submissions,
		entityAudits,
	};
}

export async function loadAccountDataBestEffort(
	args: AccountDataLoaderArgs,
): Promise<Partial<AccountDataPayload>> {
	const loaderEntries = Object.entries(ACCOUNT_DATA_LOADERS) as Array<
		[keyof AccountDataPayload, (args: AccountDataLoaderArgs) => Promise<unknown>]
	>;
	const settledResults = await Promise.allSettled(
		loaderEntries.map(([, loader]) => loader(args)),
	);

	return settledResults.reduce<Partial<AccountDataPayload>>(
		(accumulator, result, index) => {
			if (result.status === "fulfilled") {
				const [key] = loaderEntries[index];
				accumulator[key] = result.value as never;
			}
			return accumulator;
		},
		{},
	);
}
