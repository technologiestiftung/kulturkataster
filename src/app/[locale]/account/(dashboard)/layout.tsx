import type { ReactNode } from "react";
import { AccountLayoutClient } from "@/components/Account/AccountLayoutClient";
import { AccountAutoRefresh } from "@/components/Account/AccountAutoRefresh";
import { AccountStoreInitializer } from "@/components/Account/AccountStoreInitializer";
import { canTable, getTableScope } from "@/server/utils/rbac";
import { getAccountBootstrapData } from "@/server/utils/accountBootstrap";

type AccountLayoutProps = {
	children: ReactNode;
};

const resolveAccountAutoRefreshIntervalMs = () => {
	const rawValue = process.env.ACCOUNT_AUTO_REFRESH_INTERVAL_MS;
	if (!rawValue) return 10_000;
	const parsed = Number(rawValue);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
};

export default async function AccountLayout({ children }: AccountLayoutProps) {
	const accountData = await getAccountBootstrapData();
	if (!accountData) return null;
	const accountAutoRefreshIntervalMs = resolveAccountAutoRefreshIntervalMs();
	const {
		ctx,
		currentProfile,
		users,
		groups,
		roles,
		categories,
		institutions,
		submissions,
		entityAudits,
		institutionFieldPermissions,
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
	const institutionPermissions = {
		create: canTable(ctx, "institution", "create"),
		update: canTable(ctx, "institution", "update"),
		delete: canTable(ctx, "institution", "delete"),
		createSubmission: canTable(ctx, "submission", "create"),
		reviewSubmission: canTable(ctx, "submission", "update"),
	};
	const canReadActivity = canTable(ctx, "entity_audit", "read");

	const allowedTabs = [
		canReadActivity ? "activity" : null,
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
				entityAudits={entityAudits}
				institutionPermissions={institutionPermissions}
				institutionFieldPermissions={institutionFieldPermissions}
			/>
			<AccountAutoRefresh intervalMs={accountAutoRefreshIntervalMs} />
			<AccountLayoutClient
				allowedTabs={allowedTabs}
				currentProfile={currentProfile}
			>
				{children}
			</AccountLayoutClient>
		</>
	);
}
