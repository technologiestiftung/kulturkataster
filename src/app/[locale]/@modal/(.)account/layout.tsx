import type { ReactNode } from "react";
import { AccountAutoRefresh } from "@/components/Account/AccountAutoRefresh";
import { AccountStoreInitializer } from "@/components/Account/AccountStoreInitializer";
import { getAccountBootstrapData } from "@/server/utils/accountBootstrap";
import { canTable } from "@/server/utils/rbac";

type AccountModalLayoutProps = {
	children: ReactNode;
};

const resolveAccountAutoRefreshIntervalMs = () => {
	const rawValue = process.env.ACCOUNT_AUTO_REFRESH_INTERVAL_MS;
	if (!rawValue) return 10_000;
	const parsed = Number(rawValue);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
};

export default async function AccountModalLayout({
	children,
}: AccountModalLayoutProps) {
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
	const institutionPermissions = {
		create: canTable(ctx, "institution", "create"),
		update: canTable(ctx, "institution", "update"),
		delete: canTable(ctx, "institution", "delete"),
		createSubmission: canTable(ctx, "submission", "create"),
		reviewSubmission: canTable(ctx, "submission", "update"),
	};

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
			{children}
		</>
	);
}
