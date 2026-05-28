"use client";

import { useLayoutEffect } from "react";
import { useAccountStore } from "@/lib/store/accountStore";
import type { Group } from "@/types/group";
import type { Role } from "@/types/role";
import type { Profile, User } from "@/types/user";
import type { Institution, Category } from "@/types";
import type { Submission } from "@/types/submission";
import type { EntityAudit } from "@/types/entityAudit";
import type {
	InstitutionActionPermissions,
	InstitutionFieldPermissions,
} from "@/types/account";

type AccountStoreInitializerProps = {
	currentProfile: Profile | null;
	users: User[];
	groups: Group[];
	roles: Role[];
	categories: Category[];
	institutions: Institution[];
	submissions: Submission[];
	entityAudits: EntityAudit[];
	institutionPermissions: InstitutionActionPermissions;
	institutionFieldPermissions: InstitutionFieldPermissions;
};

export function AccountStoreInitializer({
	currentProfile,
	users,
	groups,
	roles,
	categories,
	institutions,
	submissions,
	entityAudits,
	institutionPermissions,
	institutionFieldPermissions,
}: AccountStoreInitializerProps) {
	const initializeAccountStore = useAccountStore(
		(state) => state.initializeAccountStore,
	);

	useLayoutEffect(() => {
		initializeAccountStore({
			currentProfile,
			users,
			groups,
			roles,
			categories,
			institutions,
			submissions,
			entityAudits,
			institutionPermissions,
			institutionFieldPermissions,
		});
	}, [
		categories,
		currentProfile,
		entityAudits,
		groups,
		initializeAccountStore,
		institutionFieldPermissions,
		institutionPermissions,
		institutions,
		roles,
		submissions,
		users,
	]);

	return null;
}
