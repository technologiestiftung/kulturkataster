// Main component
export { GroupsTable } from "./GroupsTable";

// Sub-components (if needed elsewhere)
export { GroupRow } from "./GroupRow";
export { GroupEditModal } from "./GroupEditModal";
export { InstitutionAccessEditor } from "./InstitutionAccessEditor";

// Types
export type {
	Group,
	GroupInstitutionAccess,
	InstitutionAccessType,
	DistrictAccess,
	CategoryAccess,
	InstitutionAccess,
} from "./types";

// Utils
export { formatDate } from "./utils";
