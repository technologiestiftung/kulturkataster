import { idbStorage } from "@/storage/idbStorage";
import { Category, Group, Institution, Role, Submission, User } from "@/types";
import { AccountStoreState } from "@/types/account";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const accountStoreInitialState = {
	isInitialized: false,
	currentProfile: null,
	users: [],
	groups: [],
	roles: [],
	categories: [],
	institutions: [],
	activeInstitutionEdit: null,
	submissions: [],
	entityAudits: [],
	institutionPermissions: {
		create: false,
		update: false,
		delete: false,
		createSubmission: false,
		reviewSubmission: false,
	},
	institutionFieldPermissions: {
		read: [],
		create: [],
		update: [],
		delete: [],
	},
	selectedUserId: null,
	selectedGroupId: null,
	selectedRoleId: null,
};

export const useAccountStore = create<AccountStoreState>()(
	persist(
		devtools(
			immer((set) => ({
				...accountStoreInitialState,
				initializeAccountStore: (data) =>
					set((state) => {
						state.currentProfile = data.currentProfile;
						state.users = data.users;
						state.groups = data.groups;
						state.roles = data.roles;
						state.categories = data.categories;
						state.institutions = data.institutions;
						state.submissions = data.submissions;
						state.entityAudits = data.entityAudits;
						state.institutionPermissions = data.institutionPermissions;
						state.institutionFieldPermissions =
							data.institutionFieldPermissions;
						state.isInitialized = true;
					}),
				setInitialized: () =>
					set((state) => {
						state.isInitialized = true;
					}),
				setCurrentProfile: (profile) =>
					set((state) => {
						state.currentProfile = profile;
					}),
				setUsers: (users) =>
					set((state) => {
						state.users = users;
					}),
				addUser: (user: User) =>
					set((state) => {
						state.users.unshift(user);
					}),
				upsertUser: (user: User) =>
					set((state) => {
						const index = state.users.findIndex((item) => item.id === user.id);
						if (index >= 0) {
							state.users[index] = user;
						} else {
							state.users.unshift(user);
						}
					}),
				removeUser: (id: string) =>
					set((state) => {
						state.users = state.users.filter((item) => item.id !== id);
					}),
				setGroups: (groups: Group[]) =>
					set((state) => {
						state.groups = groups;
					}),
				addGroup: (group: Group) =>
					set((state) => {
						state.groups.unshift(group);
					}),
				upsertGroup: (group: Group) =>
					set((state) => {
						const index = state.groups.findIndex(
							(item) => item.id === group.id,
						);
						if (index >= 0) {
							state.groups[index] = group;
						} else {
							state.groups.unshift(group);
						}
					}),
				removeGroup: (id: number) =>
					set((state) => {
						state.groups = state.groups.filter((item) => item.id !== id);
					}),
				setRoles: (roles: Role[]) =>
					set((state) => {
						state.roles = roles;
					}),
				addRole: (role: Role) =>
					set((state) => {
						state.roles.unshift(role);
					}),
				upsertRole: (role: Role) =>
					set((state) => {
						const index = state.roles.findIndex((item) => item.id === role.id);
						if (index >= 0) {
							state.roles[index] = role;
						} else {
							state.roles.unshift(role);
						}
					}),
				removeRole: (id: number) =>
					set((state) => {
						state.roles = state.roles.filter((item) => item.id !== id);
					}),
				setCategories: (categories: Category[]) =>
					set((state) => {
						state.categories = categories;
					}),
				addCategory: (category: Category) =>
					set((state) => {
						state.categories.unshift(category);
					}),
				upsertCategory: (category: Category) =>
					set((state) => {
						const index = state.categories.findIndex(
							(item) => item.id === category.id,
						);
						if (index >= 0) {
							state.categories[index] = category;
						} else {
							state.categories.unshift(category);
						}
					}),
				removeCategory: (id: number) =>
					set((state) => {
						state.categories = state.categories.filter(
							(item) => item.id !== id,
						);
					}),
				setInstitutions: (institutions) =>
					set((state) => {
						state.institutions = institutions;
					}),
				setActiveInstitutionEdit: (institution) =>
					set((state) => {
						state.activeInstitutionEdit = institution;
					}),
				setInstitutionPermissions: (permissions) =>
					set((state) => {
						state.institutionPermissions = permissions;
					}),
				setInstitutionFieldPermissions: (permissions) =>
					set((state) => {
						state.institutionFieldPermissions = permissions;
					}),
				addInstitution: (institution: Institution) =>
					set((state) => {
						state.institutions.unshift(institution);
					}),
				upsertInstitution: (institution: Institution) =>
					set((state) => {
						const index = state.institutions.findIndex(
							(item) => item.id === institution.id,
						);
						if (index >= 0) {
							state.institutions[index] = institution;
						} else {
							state.institutions.unshift(institution);
						}
					}),
				removeInstitution: (id: number) =>
					set((state) => {
						state.institutions = state.institutions.filter(
							(item) => item.id !== id,
						);
					}),
				setSubmissions: (submissions: Submission[]) =>
					set((state) => {
						state.submissions = submissions;
					}),
				setEntityAudits: (entityAudits) =>
					set((state) => {
						state.entityAudits = entityAudits;
					}),
				addSubmission: (submission: Submission) =>
					set((state) => {
						state.submissions.unshift(submission);
					}),
				upsertSubmission: (submission: Submission) =>
					set((state) => {
						const index = state.submissions.findIndex(
							(item) => item.id === submission.id,
						);
						if (index >= 0) {
							state.submissions[index] = submission;
						} else {
							state.submissions.unshift(submission);
						}
					}),
				removeSubmission: (id: number) =>
					set((state) => {
						state.submissions = state.submissions.filter(
							(item) => item.id !== id,
						);
					}),
				addEntityAudit: (entityAudit) =>
					set((state) => {
						state.entityAudits.unshift(entityAudit);
					}),
				upsertEntityAudit: (entityAudit) =>
					set((state) => {
						const index = state.entityAudits.findIndex(
							(item) => item.id === entityAudit.id,
						);
						if (index >= 0) {
							state.entityAudits[index] = entityAudit;
						} else {
							state.entityAudits.unshift(entityAudit);
						}
					}),
				removeEntityAudit: (id: number) =>
					set((state) => {
						state.entityAudits = state.entityAudits.filter(
							(item) => item.id !== id,
						);
					}),
				setSelectedUserId: (id: string | null) =>
					set((state) => {
						state.selectedUserId = id;
					}),
				setSelectedGroupId: (id: number | null) =>
					set((state) => {
						state.selectedGroupId = id;
					}),
				setSelectedRoleId: (id: number | null) =>
					set((state) => {
						state.selectedRoleId = id;
					}),
				setAccountData: (data) =>
					set((state) => {
						if (data.users !== undefined) state.users = data.users;
						if (data.groups !== undefined) state.groups = data.groups;
						if (data.roles !== undefined) state.roles = data.roles;
						if (data.categories !== undefined)
							state.categories = data.categories;
						if (data.institutions !== undefined)
							state.institutions = data.institutions;
						if (data.submissions !== undefined)
							state.submissions = data.submissions;
						if (data.entityAudits !== undefined)
							state.entityAudits = data.entityAudits;
					}),
			})),
		),
		{
			name: "account-storage",
			storage: createJSONStorage(() => idbStorage),
			partialize: ({
				isInitialized: _isInitialized,
				users: _users,
				institutions: _institutions,
				submissions: _submissions,
				entityAudits: _entityAudits,
				activeInstitutionEdit: _activeInstitutionEdit,
				...rest
			}) => rest,
		},
	),
);

export async function clearAccountStore() {
	useAccountStore.setState(accountStoreInitialState);
	await useAccountStore.persist.clearStorage();
}
