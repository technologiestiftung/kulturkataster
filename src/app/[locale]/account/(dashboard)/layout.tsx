import type { ReactNode } from "react";
import { AccountLayoutClient } from "@/components/Account/AccountLayoutClient";
import { AccountStoreInitializer } from "@/components/Account/AccountStoreInitializer";
import { getCategories } from "@/server/actions/categories";
import { getUsers } from "@/server/actions/users";
import { getGroups } from "@/server/actions/groups";
import { getRoles } from "@/server/actions/roles";
import { getCurrentProfile, getCurrentUser } from "@/server/actions/auth";
import { getMyInstitutions } from "@/server/actions/institutions";
import { getSubmissions } from "@/server/actions/submissions";
import {
	canTable,
	getAccessContextForUser,
	getTableScope,
} from "@/server/utils/rbac";
import { fetchIfAllowed } from "@/server/utils/rbacHelpers";

type AccountLayoutProps = {
	children: ReactNode;
};

export default async function AccountLayout({ children }: AccountLayoutProps) {
	const user = await getCurrentUser();

	if (!user) {
		return null;
	}
	const ctx = await getAccessContextForUser(user?.id);

	const [profile, users, groups, roles, categories, institutions, submissions] =
		await Promise.all([
			getCurrentProfile(),
			fetchIfAllowed(ctx, "user", "read", getUsers, []),
			fetchIfAllowed(ctx, "group", "read", getGroups, []),
			fetchIfAllowed(ctx, "role", "read", getRoles, []),
			fetchIfAllowed(ctx, "category", "update", getCategories, []),
			fetchIfAllowed(ctx, "institution", "read", getMyInstitutions, []),
			fetchIfAllowed(ctx, "submission", "read", getSubmissions, []),
		]);

	const hasUserAllScope =
		canTable(ctx, "user", "read") &&
		getTableScope(ctx, "user", "read") === "all";
	const hasGroupAllScope =
		canTable(ctx, "group", "read") &&
		getTableScope(ctx, "group", "read") === "all";
	const hasRoleAllScope =
		canTable(ctx, "role", "read") &&
		getTableScope(ctx, "role", "read") === "all";
	const hasCategoryAllScope =
		canTable(ctx, "category", "update") &&
		getTableScope(ctx, "category", "update") === "all";

	const allowedTabs = [
		"activity",
		canTable(ctx, "institution", "read") ? "institutions" : null,
		hasUserAllScope ? "users" : null,
		hasGroupAllScope ? "groups" : null,
		hasRoleAllScope ? "roles" : null,
		hasCategoryAllScope ? "categories" : null,
	].filter((tab): tab is string => !!tab);

	return (
		<>
			<AccountStoreInitializer
				currentProfile={profile}
				users={users}
				groups={groups}
				roles={roles}
				categories={categories}
				institutions={institutions}
				submissions={submissions}
			/>
			<AccountLayoutClient allowedTabs={allowedTabs} currentProfile={profile}>
				{children}
			</AccountLayoutClient>
		</>
	);
}
