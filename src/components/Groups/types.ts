export type InstitutionAccessType = "all" | "district" | "category" | "custom";

export interface DistrictAccess {
	key: string;
	name: string;
}

export interface CategoryAccess {
	key: string;
	name: string;
}

export interface SubcategoryAccess {
	key: string;
	name: string;
	categoryKey: string;
}

export interface InstitutionAccess {
	id: string;
	name: string;
}

export interface GroupInstitutionAccess {
	type: InstitutionAccessType;
	districts?: DistrictAccess[];
	categories?: CategoryAccess[];
	subcategories?: SubcategoryAccess[];
	institutions?: InstitutionAccess[];
}

export interface Group {
	id: string;
	name: string;
	description: string;
	institutionAccess: GroupInstitutionAccess;
	userCount: number;
	institutionCount: number;
	createdAt: Date;
}
