"use client";

import { useEffect } from "react";
import { useAccountStore } from "@/lib/store/accountStore";
import type { Group } from "@/types/group";
import type { Role } from "@/types/role";
import type { User } from "@/types/user";
import type { Institution, Category } from "@/types";

type AccountStoreInitializerProps = {
	users: User[];
	groups: Group[];
	roles: Role[];
	categories: Category[];
	institutions: Institution[];
};

export function AccountStoreInitializer({
	users,
	groups,
	roles,
	categories,
	institutions,
}: AccountStoreInitializerProps) {
	const setUsers = useAccountStore((state) => state.setUsers);
	const setGroups = useAccountStore((state) => state.setGroups);
	const setRoles = useAccountStore((state) => state.setRoles);
	const setCategories = useAccountStore((state) => state.setCategories);
	const setInstitutions = useAccountStore((state) => state.setInstitutions);

	useEffect(() => {
		setUsers(users);
	}, [setUsers, users]);

	useEffect(() => {
		setGroups(groups);
	}, [setGroups, groups]);

	useEffect(() => {
		setRoles(roles);
	}, [setRoles, roles]);

	useEffect(() => {
		setCategories(categories);
	}, [setCategories, categories]);

	useEffect(() => {
		setInstitutions(institutions);
	}, [setInstitutions, institutions]);

	return null;
}
