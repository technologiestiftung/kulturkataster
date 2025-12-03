// Institution field clusters (mirrors Supabase grouping)
export const FIELD_CLUSTERS = [
	"General Information",
	"Address",
	"Contact Information",
	"Basic Information",
	"Detailed Information",
	"Shared Use",
	"Funding",
] as const;

export type FieldCluster = (typeof FIELD_CLUSTERS)[number];

// Per-field permissions
export interface FieldPermissions {
	view: boolean;
	requestChange: boolean;
	approveChange: boolean;
}

// Field permissions map
export type FieldPermissionsMap = {
	[K in FieldCluster]: FieldPermissions;
};

export interface RolePermissions {
	fields: FieldPermissionsMap;
	createInstitution: boolean;
	publishInstitution: boolean;
	changeStatus: boolean;
	deleteInstitution: boolean;
	manageUsers: boolean;
	manageGroups: boolean;
}

export interface Role {
	id: string;
	name: string;
	description: string;
	permissions: RolePermissions;
	scopeRestriction: boolean;
	userCount: number;
	createdAt: Date;
	isSystemRole?: boolean;
}
