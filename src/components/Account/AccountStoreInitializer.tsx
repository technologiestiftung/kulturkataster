"use client";

import { useEffect } from "react";
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
	const setCurrentProfile = useAccountStore((state) => state.setCurrentProfile);
	const setUsers = useAccountStore((state) => state.setUsers);
	const setGroups = useAccountStore((state) => state.setGroups);
	const setRoles = useAccountStore((state) => state.setRoles);
	const setCategories = useAccountStore((state) => state.setCategories);
	const setInstitutions = useAccountStore((state) => state.setInstitutions);
	const setSubmissions = useAccountStore((state) => state.setSubmissions);
	const setEntityAudits = useAccountStore((state) => state.setEntityAudits);
	const setInstitutionPermissions = useAccountStore(
		(state) => state.setInstitutionPermissions,
	);
	const setInstitutionFieldPermissions = useAccountStore(
		(state) => state.setInstitutionFieldPermissions,
	);
	const setInitialized = useAccountStore((state) => state.setInitialized);

	useEffect(() => {
		setCurrentProfile(currentProfile);
	}, [setCurrentProfile, currentProfile]);

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

	useEffect(() => {
		setSubmissions(submissions);
	}, [setSubmissions, submissions]);

	useEffect(() => {
		setEntityAudits(entityAudits);
	}, [setEntityAudits, entityAudits]);

	useEffect(() => {
		setInstitutionPermissions(institutionPermissions);
	}, [setInstitutionPermissions, institutionPermissions]);

	useEffect(() => {
		setInstitutionFieldPermissions(institutionFieldPermissions);
	}, [setInstitutionFieldPermissions, institutionFieldPermissions]);

	useEffect(() => {
		setInitialized();
	}, [setInitialized]);

	return null;
}
