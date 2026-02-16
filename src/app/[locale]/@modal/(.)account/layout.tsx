import type { ReactNode } from "react";
import { AccountStoreInitializer } from "@/components/Account/AccountStoreInitializer";
import { getAccountBootstrapData } from "@/server/utils/accountBootstrap";
import { canTable } from "@/server/utils/rbac";

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
				institutionPermissions={institutionPermissions}
				institutionFieldPermissions={institutionFieldPermissions}
			/>
			{children}
		</>
	);
}
