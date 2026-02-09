import type { ReactNode } from "react";
import { AccountLayoutClient } from "@/components/Account/AccountLayoutClient";
import { AccountStoreInitializer } from "@/components/Account/AccountStoreInitializer";
import { canTable, getTableScope } from "@/server/utils/rbac";
import { getAccountBootstrapData } from "@/server/utils/accountBootstrap";

type AccountLayoutProps = {
	children: ReactNode;
};

export default async function AccountLayout({ children }: AccountLayoutProps) {
	const accountData = await getAccountBootstrapData();
	if (!accountData) return null;
	const {
		ctx,
		currentProfile,
		users,
		groups,
		roles,
		categories,
		institutions,
		submissions,
	} = accountData;

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
				currentProfile={currentProfile}
				users={users}
				groups={groups}
				roles={roles}
				categories={categories}
				institutions={institutions}
				submissions={submissions}
			/>
			<AccountLayoutClient
				allowedTabs={allowedTabs}
				currentProfile={currentProfile}
			>
				{children}
			</AccountLayoutClient>
		</>
	);
}
