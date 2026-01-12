import { AccountStoreState } from "@/types/account";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useAccountStore = create<AccountStoreState>()(
	devtools((set) => ({
		users: [],
		groups: [],
		roles: [],
		categories: [],
		institutions: [],
		selectedUserId: null,
		selectedGroupId: null,
		selectedRoleId: null,
		setUsers: (users) => set({ users }),
		setGroups: (groups) => set({ groups }),
		setRoles: (roles) => set({ roles }),
		setCategories: (categories) => set({ categories }),
		setInstitutions: (institutions) => set({ institutions }),
		setSelectedUserId: (id) => set({ selectedUserId: id }),
		setSelectedGroupId: (id) => set({ selectedGroupId: id }),
		setSelectedRoleId: (id) => set({ selectedRoleId: id }),
	})),
);
