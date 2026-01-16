import type { User } from "@/types/user";
import type { Group } from "@/types/group";
import type { Role } from "@/types/role";
import type { Institution } from "@/types/institution";
import type { Category } from "@/types/category";

export type AccountStoreState = {
	users: User[];
	groups: Group[];
	roles: Role[];
	categories: Category[];
	institutions: Institution[];
	selectedUserId: string | null;
	selectedGroupId: string | null;
	selectedRoleId: string | null;
	alertDialog: { title: string; description: string } | null;
	setUsers: (users: User[]) => void;
	setGroups: (groups: Group[]) => void;
	setRoles: (roles: Role[]) => void;
	setCategories: (categories: Category[]) => void;
	setInstitutions: (institutions: Institution[]) => void;
	setSelectedUserId: (id: string | null) => void;
	setSelectedGroupId: (id: string | null) => void;
	setSelectedRoleId: (id: string | null) => void;
	setAlertDialog: (alert: { title: string; description: string } | null) => void;
};
