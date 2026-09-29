import { Prisma } from "@/generated/prisma";
import {
	canTable,
	createNoAccessWhere,
	getScopeUserId,
	getTableScope,
	type AccessContext,
	type Action,
} from "@/server/utils/rbac";

export const buildInstitutionAccessWhere = (
	userId: string,
): Prisma.InstitutionWhereInput => ({
	OR: [
		{ users: { some: { id: userId } } },
		{ groups: { some: { users: { some: { id: userId } } } } },
	],
});

export const buildInstitutionScopedWhere = (
	scope: "own" | "all",
	userId: string | null,
	baseWhere?: Prisma.InstitutionWhereInput,
): Prisma.InstitutionWhereInput | undefined => {
	const ownerId = getScopeUserId(scope, userId);
	if (!ownerId && scope === "all") return baseWhere;
	if (!ownerId) {
		return createNoAccessWhere(baseWhere);
	}
	const accessWhere = buildInstitutionAccessWhere(ownerId);
	if (!baseWhere) return accessWhere;
	return { AND: [baseWhere, accessWhere] };
};

const hasGlobalInstitutionAccess = (ctx: AccessContext, action: Action) =>
	canTable(ctx, "institution", action) &&
	getTableScope(ctx, "institution", action) === "all";

// CSV import creates and overwrites arbitrary places, so it is limited to admins with global access.
export const canImportInstitutions = (ctx: AccessContext) =>
	hasGlobalInstitutionAccess(ctx, "create") &&
	hasGlobalInstitutionAccess(ctx, "update");
