import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AccountLayoutClient } from "@/components/Account/AccountLayoutClient";
import { AccountStoreInitializer } from "@/components/Account/AccountStoreInitializer";
import { getCategories } from "@/server/actions/categories";
import { getUsers } from "@/server/actions/users";
import { getGroups } from "@/server/actions/groups";
import { getRoles } from "@/server/actions/roles";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";
import { getMyInstitutions } from "@/server/actions/institutions";

type AccountLayoutProps = {
	children: ReactNode;
};

export default async function AccountLayout({ children }: AccountLayoutProps) {
	const userId = await getCurrentUserId();
	if (!userId) {
		redirect("/auth/login");
	}

	const [users, groups, roles, categories, institutions] = await Promise.all([
		getUsers(),
		getGroups(),
		getRoles(),
		getCategories(),
		getMyInstitutions(),
	]);

	return (
		<>
			<AccountStoreInitializer
				users={users}
				groups={groups}
				roles={roles}
				categories={categories}
				institutions={institutions}
			/>
			<AccountLayoutClient>{children}</AccountLayoutClient>
		</>
	);
}
