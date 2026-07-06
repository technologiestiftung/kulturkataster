import type { Profile, User } from "@/types/user";
import type { Group } from "@/types/group";
import type { Role } from "@/types/role";
import type { Institution } from "@/types/institution";
import type { Category } from "@/types/category";
import type { Submission } from "@/types/submission";
import type { EntityAudit } from "@/types/entityAudit";

export type InstitutionActionPermissions = {
	create: boolean;
	update: boolean;
	delete: boolean;
	createSubmission: boolean;
	reviewSubmission: boolean;
};

export type InstitutionFieldPermissions = {
	read: string[];
	create: string[];
	update: string[];
	delete: string[];
	download: string[];
};

export type AccountStoreState = {
	isInitialized: boolean;
	currentProfile: Profile | null;
	users: User[];
	groups: Group[];
	roles: Role[];
	categories: Category[];
	institutions: Institution[];
	activeInstitutionEdit: Institution | null;
	submissions: Submission[];
	entityAudits: EntityAudit[];
	institutionPermissions: InstitutionActionPermissions;
	institutionFieldPermissions: InstitutionFieldPermissions;
	selectedUserId: string | null;
	selectedGroupId: number | null;
	selectedRoleId: number | null;
	initializeAccountStore: (data: {
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
	}) => void;
	setInitialized: () => void;
	setCurrentProfile: (profile: Profile | null) => void;
	setUsers: (users: User[]) => void;
	setGroups: (groups: Group[]) => void;
	setRoles: (roles: Role[]) => void;
	setCategories: (categories: Category[]) => void;
	setInstitutions: (institutions: Institution[]) => void;
	setActiveInstitutionEdit: (institution: Institution | null) => void;
	setEntityAudits: (entityAudits: EntityAudit[]) => void;
	setInstitutionPermissions: (
		permissions: InstitutionActionPermissions,
	) => void;
	setInstitutionFieldPermissions: (
		permissions: InstitutionFieldPermissions,
	) => void;
	addUser: (user: User) => void;
	upsertUser: (user: User) => void;
	removeUser: (id: string) => void;
	addGroup: (group: Group) => void;
	upsertGroup: (group: Group) => void;
	removeGroup: (id: number) => void;
	addRole: (role: Role) => void;
	upsertRole: (role: Role) => void;
	removeRole: (id: number) => void;
	addCategory: (category: Category) => void;
	upsertCategory: (category: Category) => void;
	removeCategory: (id: number) => void;
	addInstitution: (institution: Institution) => void;
	upsertInstitution: (institution: Institution) => void;
	removeInstitution: (id: number) => void;
	setSubmissions: (submissions: Submission[]) => void;
	addSubmission: (submission: Submission) => void;
	upsertSubmission: (submission: Submission) => void;
	removeSubmission: (id: number) => void;
	addEntityAudit: (entityAudit: EntityAudit) => void;
	upsertEntityAudit: (entityAudit: EntityAudit) => void;
	removeEntityAudit: (id: number) => void;
	setSelectedUserId: (id: string | null) => void;
	setSelectedGroupId: (id: number | null) => void;
	setSelectedRoleId: (id: number | null) => void;
	setAccountData: (data: {
		users?: User[];
		groups?: Group[];
		roles?: Role[];
		categories?: Category[];
		institutions?: Institution[];
		submissions?: Submission[];
		entityAudits?: EntityAudit[];
	}) => void;
};
