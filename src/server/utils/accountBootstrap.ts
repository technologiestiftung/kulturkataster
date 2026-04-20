import type { getCategories } from "@/server/actions/categories";
import { getCurrentUser } from "@/server/actions/auth";
import type { getCurrentProfile } from "@/server/actions/auth";
import type { getEntityAudits } from "@/server/actions/entityAudits";
import type { getGroups } from "@/server/actions/groups";
import type { getMyInstitutions } from "@/server/actions/institutions";
import type { getRoles } from "@/server/actions/roles";
import type { getSubmissions } from "@/server/actions/submissions";
import type { getUsers } from "@/server/actions/users";
import { prisma } from "@/server/prisma";
import { loadAccountData } from "@/server/utils/accountData";
import {
	getAccessContextForUser,
	getFieldPermissionListsForTable,
	type AccessContext,
} from "@/server/utils/rbac";

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
	const [currentProfile, accountData] = await Promise.all([
		prisma.user.findUnique({ where: { id: user.id } }),
		loadAccountData({
			ctx,
			currentUserId: user.id,
		}),
	]);

	return {
		ctx,
		currentProfile,
		...accountData,
		institutionFieldPermissions: getFieldPermissionListsForTable(
			ctx,
			"institution",
		),
	};
}
