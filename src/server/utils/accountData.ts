import { categoryRepo } from "@/server/data/categoryRepo";
import { groupRepo } from "@/server/data/groupRepo";
import { institutionRepo } from "@/server/data/institutionRepo";
import { roleRepo } from "@/server/data/roleRepo";
import { submissionRepo } from "@/server/data/submissionRepo";
import { userRepo } from "@/server/data/userRepo";
import { loadAccountEntityAudits } from "@/server/utils/accountEntityAudits";
import { buildInstitutionScopedWhere } from "@/server/logic/institutionAccess";
import { buildInstitutionSelect } from "@/server/logic/institutionSelect";
import {
	canTable,
	getTableScope,
	requireScopeOrUser,
	type AccessContext,
} from "@/server/utils/rbac";
import type { AccountStoreState } from "@/types/account";

export type AccountDataPayload = {
	users: AccountStoreState["users"];
	groups: AccountStoreState["groups"];
	roles: AccountStoreState["roles"];
	categories: AccountStoreState["categories"];
	institutions: AccountStoreState["institutions"];
	submissions: AccountStoreState["submissions"];
	entityAudits: AccountStoreState["entityAudits"];
};

type AccountDataLoaderArgs = {
	ctx: AccessContext;
	currentUserId: string;
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
	// The institutions table needs to know whether an institution has
	// submitted questionnaire answers (to show/hide the download icon) — add
	// it here rather than in buildInstitutionSelectFromFields, since that
	// builder is shared with the public/anonymous institution data loader.
	const selectWithAnswerCount = {
		...select,
		_count: { select: { answers: true } },
	};

	const scope = getTableScope(ctx, "institution", "read");
	if (scope === "all") {
		return institutionRepo.listWithSelect(selectWithAnswerCount);
	}

	const where = buildInstitutionScopedWhere(scope, currentUserId);
	if (!where) return [];
	return institutionRepo.listWithSelectWhere(where, selectWithAnswerCount);
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
	return loadAccountEntityAudits({ ctx, currentUserId });
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
	keys?: Array<keyof AccountDataPayload>,
): Promise<Partial<AccountDataPayload>> {
	const allEntries = Object.entries(ACCOUNT_DATA_LOADERS) as Array<
		[
			keyof AccountDataPayload,
			(args: AccountDataLoaderArgs) => Promise<unknown>,
		]
	>;
	const loaderEntries = keys
		? allEntries.filter(([key]) => keys.includes(key))
		: allEntries;
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
