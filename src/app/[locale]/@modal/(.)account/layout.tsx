import type { ReactNode } from "react";
import { AccountStoreInitializer } from "@/components/Account/AccountStoreInitializer";
import { getAccountBootstrapData } from "@/server/utils/accountBootstrap";
import { canTable, getTableScope } from "@/server/utils/rbac";

type AccountModalLayoutProps = {
	children: ReactNode;
};

export default async function AccountModalLayout({
	children,
}: AccountModalLayoutProps) {
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
	const institutionPermissions = {
		create:
			canTable(ctx, "institution", "create") &&
			getTableScope(ctx, "institution", "create") === "all",
		update:
			canTable(ctx, "institution", "update") &&
			getTableScope(ctx, "institution", "update") === "all",
		delete:
			canTable(ctx, "institution", "delete") &&
			getTableScope(ctx, "institution", "delete") === "all",
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
				institutionPermissions={institutionPermissions}
			/>
			{children}
		</>
	);
}
