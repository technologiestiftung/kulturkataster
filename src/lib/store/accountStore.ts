import { idbStorage } from "@/storage/idbStorage";
import { Category, Group, Institution, Role, Submission, User } from "@/types";
import { AccountStoreState } from "@/types/account";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useAccountStore = create<AccountStoreState>()(
	persist(
		devtools(
			immer((set) => ({
				users: [],
				groups: [],
				roles: [],
				categories: [],
				institutions: [],
				submissions: [],
				selectedUserId: null,
				selectedGroupId: null,
				selectedRoleId: null,
				alertDialog: null,
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
				setAlertDialog: (alert) =>
					set((state) => {
						state.alertDialog = alert;
					}),
			})),
		),
		{ name: "account-storage", storage: createJSONStorage(() => idbStorage) },
	),
);
