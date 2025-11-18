// Main component
export { RolesTable } from "./RolesTable";

// Sub-components (if needed elsewhere)
export { RoleRow } from "./RoleRow";
export { RoleEditModal } from "./RoleEditModal";
export { FieldPermissionsTable } from "./FieldPermissionsTable";
export { PermissionsSummary } from "./PermissionsSummary";

// Types
export type {
	Role,
	RolePermissions,
	FieldPermissions,
	FieldPermissionsMap,
	InstitutionField,
} from "./types";
export { INSTITUTION_FIELDS } from "./types";

// Utils
export { createFieldPermissions, getPermissionSummary } from "./utils";
