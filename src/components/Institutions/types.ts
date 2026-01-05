export interface InstitutionContact {
	name: string;
	email: string;
	phone?: string;
}

export interface InstitutionAddress {
	street: string;
	city: string;
	district?: string;
	postalCode: string;
	country: string;
}

export interface Institution {
	id: string;
	name: string;
	slug: string;
	type:
		| "museum"
		| "gallery"
		| "theater"
		| "library"
		| "archive"
		| "monument"
		| "other";
	status: "active" | "inactive" | "pending";
	address: InstitutionAddress;
	contact: InstitutionContact;
	website?: string;
	description?: string;
	createdAt: Date;
	updatedAt: Date;
	ownerUserId?: string;
	ownerName?: string;
	verified: boolean;
}

export type SortColumn =
	| "name"
	| "type"
	| "status"
	| "city"
	| "owner"
	| "verified"
	| "createdAt"
	| "updatedAt";
