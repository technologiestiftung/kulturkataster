import { getCategories } from "@/server/actions/categories";
import { getCurrentProfile, getCurrentUser } from "@/server/actions/auth";
import { getEntityAudits } from "@/server/actions/entityAudits";
import { getGroups } from "@/server/actions/groups";
import { getMyInstitutions } from "@/server/actions/institutions";
import { getRoles } from "@/server/actions/roles";
import { getSubmissions } from "@/server/actions/submissions";
import { getUsers } from "@/server/actions/users";
import {
	getAccessContextForUser,
	getFieldPermissionListsForTable,
	type AccessContext,
} from "@/server/utils/rbac";
import { fetchIfAllowed } from "@/server/utils/rbacHelpers";

export type AccountBootstrapData = {
	ctx: AccessContext;
	currentProfile: Awaited<ReturnType<typeof getCurrentProfile>>;
	users: Awaited<ReturnType<typeof getUsers>>;
	groups: Awaited<ReturnType<typeof getGroups>>;
	roles: Awaited<ReturnType<typeof getRoles>>;
	categories: Awaited<ReturnType<typeof getCategories>>;
	institutions: Awaited<ReturnType<typeof getMyInstitutions>>;
	submissions: Awaited<ReturnType<typeof getSubmissions>>;
	entityAudits: Awaited<ReturnType<typeof getEntityAudits>>;
	institutionFieldPermissions: ReturnType<
		typeof getFieldPermissionListsForTable
	>;
};

export async function getAccountBootstrapData(): Promise<AccountBootstrapData | null> {
	const user = await getCurrentUser();
	if (!user) return null;

	const ctx = await getAccessContextForUser(user.id);
	const [
		currentProfile,
		users,
		groups,
		roles,
		categories,
		institutions,
		submissions,
		entityAudits,
	] = await Promise.all([
		getCurrentProfile(),
		fetchIfAllowed(ctx, "user", "read", getUsers, []),
		fetchIfAllowed(ctx, "group", "read", getGroups, []),
		fetchIfAllowed(ctx, "role", "read", getRoles, []),
		fetchIfAllowed(ctx, "category", "update", getCategories, []),
		fetchIfAllowed(ctx, "institution", "read", getMyInstitutions, []),
		fetchIfAllowed(ctx, "submission", "read", getSubmissions, []),
		fetchIfAllowed(ctx, "entity_audit", "read", getEntityAudits, []),
	]);

	return {
		ctx,
		currentProfile,
		users,
		groups,
		roles,
		categories,
		institutions,
		submissions,
		entityAudits,
		institutionFieldPermissions: getFieldPermissionListsForTable(
			ctx,
			"institution",
		),
	};
}
