// Institution field names
export const INSTITUTION_FIELDS = [
	"name",
	"categories",
	"district",
	"parent_organizations",
	"cultural_areas",
	"subcategories",
	"rooms_count",
	"support_type",
	"source",
	"cultural_area",
	"owner",
	"funding_type",
	"closing_reason",
	"created_at",
	"updated_at",
	"city",
	"address",
	"postal_code",
	"email",
	"phone",
	"website",
	"description",
	"opening_hours",
	"accessibility",
	"notes",
] as const;

export type InstitutionField = (typeof INSTITUTION_FIELDS)[number];

// Per-field permissions
export interface FieldPermissions {
	view: boolean;
	requestChange: boolean;
	approveChange: boolean;
}

// Field permissions map
export type FieldPermissionsMap = {
	[K in InstitutionField]: FieldPermissions;
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
