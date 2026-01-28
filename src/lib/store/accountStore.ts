import { idbStorage } from "@/storage/idbStorage";
import { AccountStoreState } from "@/types/account";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

export const useAccountStore = create<AccountStoreState>()(
	persist(
		devtools((set) => ({
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
			setUsers: (users) => set({ users }),
			setGroups: (groups) => set({ groups }),
			setRoles: (roles) => set({ roles }),
			setCategories: (categories) => set({ categories }),
			setInstitutions: (institutions) => set({ institutions }),
			setSubmissions: (submissions) => set({ submissions }),
			setSelectedUserId: (id) => set({ selectedUserId: id }),
			setSelectedGroupId: (id) => set({ selectedGroupId: id }),
			setSelectedRoleId: (id) => set({ selectedRoleId: id }),
			setAlertDialog: (alert) => set({ alertDialog: alert }),
		})),
		{ name: "account-storage", storage: createJSONStorage(() => idbStorage) },
	),
);
