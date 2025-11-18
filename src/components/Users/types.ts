export type AccessType = "inherit" | "custom";

export interface InstitutionAccess {
	id: string;
	name: string;
}

export interface UserAccessDetails {
	type: AccessType;
	source: "group-inherited" | "individual-override" | "mixed";
	customInstitutions?: InstitutionAccess[];
	institutionCount: number;
}

export interface Group {
	id: string;
	name: string;
}

export interface User {
	id: string;
	name: string;
	email: string;
	role:
		| "admin"
		| "editor"
		| "redaktion"
		| "contributor"
		| "publisher"
		| "viewer";
	status: "active" | "inactive" | "pending";
	lastActivity: Date;
	access: UserAccessDetails;
	groups: Group[];
}

export type SortColumn =
	| "name"
	| "email"
	| "role"
	| "groups"
	| "status"
	| "lastActivity"
	| "access";
