import type { ReactNode } from "react";
import { AccountStoreInitializer } from "@/components/Account/AccountStoreInitializer";
import { getAccountBootstrapData } from "@/server/utils/accountBootstrap";

type AccountModalLayoutProps = {
	children: ReactNode;
};

export default async function AccountModalLayout({
	children,
}: AccountModalLayoutProps) {
	const accountData = await getAccountBootstrapData();
	if (!accountData) return null;

	const {
		currentProfile,
		users,
		groups,
		roles,
		categories,
		institutions,
		submissions,
	} = accountData;

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
			{children}
		</>
	);
}
