import type { ReactNode } from "react";
import { AccountLayoutClient } from "@/components/Account/AccountLayoutClient";
import { AccountStoreInitializer } from "@/components/Account/AccountStoreInitializer";
import { getCategories } from "@/server/actions/categories";
import { getUsers } from "@/server/actions/users";
import { getGroups } from "@/server/actions/groups";
import { getRoles } from "@/server/actions/roles";
import { requireAuth } from "@/server/auth/getCurrentUser";
import { getMyInstitutions } from "@/server/actions/institutions";
import { canTable, getAccessContextForUser } from "@/server/utils/rbac";
import { fetchIfAllowed } from "@/server/utils/rbacHelpers";
import { userRepo } from "@/server/data/userRepo";

type AccountLayoutProps = {
	children: ReactNode;
};

export default async function AccountLayout({ children }: AccountLayoutProps) {
	const currentUser = await requireAuth();
	if (!currentUser.email) {
		throw new Error("Authenticated user is missing an email.");
	}

	await userRepo.ensureUser({
		id: currentUser.id,
		email: currentUser.email,
	});

	const ctx = await getAccessContextForUser(currentUser.id);

	const [users, groups, roles, categories, institutions] = await Promise.all([
		fetchIfAllowed(ctx, "user", "read", getUsers, []),
		fetchIfAllowed(ctx, "group", "read", getGroups, []),
		fetchIfAllowed(ctx, "role", "read", getRoles, []),
		fetchIfAllowed(ctx, "category", "update", getCategories, []),
		fetchIfAllowed(ctx, "institution", "read", getMyInstitutions, []),
	]);

	const allowedTabs = [
		"activity",
		canTable(ctx, "institution", "read") ? "institutions" : null,
		canTable(ctx, "user", "read") ? "users" : null,
		canTable(ctx, "group", "read") ? "groups" : null,
		canTable(ctx, "role", "read") ? "roles" : null,
		canTable(ctx, "category", "update") ? "categories" : null,
	].filter((tab): tab is string => !!tab);

	return (
		<>
			<AccountStoreInitializer
				users={users}
				groups={groups}
				roles={roles}
				categories={categories}
				institutions={institutions}
			/>
			<AccountLayoutClient allowedTabs={allowedTabs} user={currentUser}>
				{children}
			</AccountLayoutClient>
		</>
	);
}
