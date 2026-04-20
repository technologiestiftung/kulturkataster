import { getCurrentUser } from "@/server/actions/auth";
import type { getCurrentProfile } from "@/server/actions/auth";
import { prisma } from "@/server/prisma";
import {
	loadAccountData,
	type AccountDataPayload,
} from "@/server/utils/accountData";
import {
	getAccessContextForUser,
	getFieldPermissionListsForTable,
	type AccessContext,
} from "@/server/utils/rbac";

export type AccountBootstrapData = {
	ctx: AccessContext;
	currentProfile: Awaited<ReturnType<typeof getCurrentProfile>>;
	users: AccountDataPayload["users"];
	groups: AccountDataPayload["groups"];
	roles: AccountDataPayload["roles"];
	categories: AccountDataPayload["categories"];
	institutions: AccountDataPayload["institutions"];
	submissions: AccountDataPayload["submissions"];
	entityAudits: AccountDataPayload["entityAudits"];
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
