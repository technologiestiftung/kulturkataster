import type {
	FundingType,
	InstitutionStatus,
	Prisma,
	ProtectionStatus,
	UtilizationStatus,
} from "@/generated/prisma";
import type { Category } from "@/types/category";
import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { OwnerType, RentalContractType } from "@/generated/prisma";

export type PrismaInstitutionWithRelations = Prisma.InstitutionGetPayload<{
	include: {
		address: true;
		categories: true;
		contact_person: true;
		tags: true;
		users: true;
		groups: true;
	};
}>;

export type Institution = PrismaInstitutionWithRelations;

export type InstitutionCreateInput = Prisma.InstitutionCreateInput;

export type InstitutionUpdateInput = Prisma.InstitutionUpdateInput;

export type InstitutionWhereInput = Prisma.InstitutionWhereInput;

export type AddressInput = Prisma.AddressCreateInput & {
	id?: number;
};

export type InstitutionForm = {
	name: string;
	website?: string | null;
	phone?: string | null;
	email?: string | null;
	area?: number | null;
	number_of_rooms?: number | null;
	parent_organization?: string | null;
	legal_form?: string | null;
	capacity?: number | null;
	owner_name?: string | null;
	owner_type?: OwnerType | null;
	rental_contract_type?: RentalContractType | null;
	rental_contract_end?: Date | string | null;
	funding_type?: FundingType | null;
	utilization_status?: UtilizationStatus | null;
	utilization_status_info?: string | null;
	protection_status?: ProtectionStatus | null;
	protection_status_info?: string | null;
	shared_use_allowed?: boolean | null;
	shared_use_info?: string | null;
	shared_use_equipment?: string | null;
	shared_use_audience?: string | null;
	shared_use_availability?: string | null;
	accessibility?: string | null;
	cost?: string | null;
	established_since?: Date | string | null;
	established_until?: Date | string | null;
	closing_reason?: string | null;
	notes?: string | null;
	internal_notes?: string | null;
	status?: InstitutionStatus | null;
	import_identifier?: string | null;
	source?: string | null;
	shared_use_contact_person?: string | null;
	contact_person_id?: number | null;
	address?: AddressInput | null;
	categoryIds?: number[];
	tagIds?: number[];
	userIds?: string[];
	groupIds?: number[];
};

export type InstitutionUpdateForm = InstitutionForm & {
	id: number;
};

export const INSTITUTION_PERMISSION_FIELDS = [
	"address",
	"categories",
	"contact_person",
	"groups",
	"tags",
	"users",
	"name",
	"website",
	"phone",
	"email",
	"area",
	"number_of_rooms",
	"parent_organization",
	"legal_form",
	"capacity",
	"owner_name",
	"owner_type",
	"rental_contract_type",
	"rental_contract_end",
	"funding_type",
	"utilization_status",
	"utilization_status_info",
	"protection_status",
	"protection_status_info",
	"shared_use_allowed",
	"shared_use_info",
	"shared_use_equipment",
	"shared_use_audience",
	"shared_use_availability",
	"shared_use_contact_person",
	"accessibility",
	"cost",
	"established_since",
	"established_until",
	"closing_reason",
	"notes",
	"internal_notes",
	"status",
	"import_identifier",
	"source",
] as const satisfies readonly (keyof Institution)[];

export interface GeoFeature {
	id: string;
	place_name: string;
	center: [number, number];
	geometry: {
		coordinates: [number, number];
	};
	text?: string;
	bbox?: [number, number, number, number];
}

export type SearchResult = Institution | GeoFeature;

export interface FilterState {
	district_keys: string[];
	category_keys: string[];
	subcategory_keys: string[];
	include_closed: boolean;
	status: string | undefined; // e.g., "open", "closed", etc.
}

export interface InstitutionStoreState {
	allInstitutions: Institution[] | null;
	filteredInstitutions: Institution[] | null;
	allInstitutionsGeoJSON: FeatureCollection<Geometry, GeoJsonProperties> | null;
	filteredInstitutionsGeoJSON: FeatureCollection<
		Geometry,
		GeoJsonProperties
	> | null;
	categoryCounts: Record<string, number>;
	subcategoryCounts: Record<string, number>;
	selectedInstitutionId: number | string | null;
	filters: FilterState;
	categories: Category[] | null;
	setCategories: (categories: Category[] | null) => void;
	setInstitutions: (institutions: Institution[] | null) => void;
	setSelectedInstitutionId: (id: string | number | null) => void;
	setFilters: (filters: FilterState) => void;
	initializeCategories: () => Promise<void>;
	initializeInstitutions: () => Promise<void>;
}
