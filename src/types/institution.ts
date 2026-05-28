import type {
	Address,
	FundingSource,
	FundingType,
	InstitutionStatus,
	SubmissionStatus,
	Prisma,
	ProtectionStatus,
	SubmissionType,
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

export type Institution = PrismaInstitutionWithRelations & {
	funding_sources?: FundingSource[];
	categoryIds?: number[] | null;
};

export type InstitutionTableBase = {
	id: Institution["id"];
	name: Institution["name"];
	status: Institution["status"] | SubmissionStatus;
	email: Institution["email"];
	phone: Institution["phone"];
	website: Institution["website"];
	parent_organization: Institution["parent_organization"];
	address: AddressInput | Address | null;
	categories: Category[];
	tags: Institution["tags"];
	users: Institution["users"];
	groups: Institution["groups"];
	owner_name?: Institution["owner_name"];
	owner_type?: Institution["owner_type"];
	rental_contract_type?: Institution["rental_contract_type"];
	rental_contract_end?: Institution["rental_contract_end"];
	funding_type?: Institution["funding_type"];
	funding_sources?: FundingSourceInput[] | FundingSource[] | null;
	utilization_status?: Institution["utilization_status"];
	utilization_status_info?: Institution["utilization_status_info"];
	utilization_status_internal_notes?: Institution["utilization_status_internal_notes"];
	protection_status?: Institution["protection_status"];
	protection_status_info?: Institution["protection_status_info"];
	protection_status_internal_notes?: Institution["protection_status_internal_notes"];
	shared_use_allowed?: Institution["shared_use_allowed"];
	shared_use_info?: Institution["shared_use_info"];
	shared_use_equipment?: Institution["shared_use_equipment"];
	shared_use_audience?: Institution["shared_use_audience"];
	shared_use_availability?: Institution["shared_use_availability"];
	accessibility?: Institution["accessibility"];
	cost?: Institution["cost"];
	established_since?: Institution["established_since"];
	established_until?: Institution["established_until"];
	closing_reason?: Institution["closing_reason"];
	notes?: Institution["notes"];
	internal_notes?: Institution["internal_notes"];
	source?: Institution["source"];
	shared_use_contact_person?: Institution["shared_use_contact_person"];
	contact_person?: Institution["contact_person"];
	contact_person_id?: Institution["contact_person_id"];
	area?: Institution["area"];
	number_of_rooms?: Institution["number_of_rooms"];
	legal_form?: Institution["legal_form"];
	capacity?: Institution["capacity"];
	created_at: Institution["created_at"];
	updated_at: Institution["updated_at"];
};

export type InstitutionRow = InstitutionTableBase & {
	rowKind: "institution";
	rowKey: string;
};

export type SubmissionRow = InstitutionTableBase & {
	rowKind: "submission";
	rowKey: string;
	submissionId: number;
	submissionType: SubmissionType;
};

export type InstitutionTableRow = InstitutionRow | SubmissionRow;

export type InstitutionCreateInput = Prisma.InstitutionCreateInput;

export type InstitutionUpdateInput = Prisma.InstitutionUpdateInput;

export type InstitutionWhereInput = Prisma.InstitutionWhereInput;

export type AddressInput = Prisma.AddressCreateInput & {
	id?: number;
};

export type FundingSourceInput = {
	id?: number;
	source_name: string;
	description?: string | null;
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
	funding_source?: FundingSourceInput | null;
	funding_sources?: FundingSourceInput[] | null;
	utilization_status?: UtilizationStatus | null;
	utilization_status_info?: string | null;
	utilization_status_internal_notes?: string | null;
	protection_status?: ProtectionStatus | null;
	protection_status_info?: string | null;
	protection_status_internal_notes?: string | null;
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
	contact_person_first_name?: string | null;
	contact_person_last_name?: string | null;
	contact_person_email?: string | null;
	contact_person_phone?: string | null;
	contact_person_id?: number | null;
	address: AddressInput | null;
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
	"funding_sources",
	"utilization_status",
	"utilization_status_info",
	"utilization_status_internal_notes",
	"protection_status",
	"protection_status_info",
	"protection_status_internal_notes",
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
	"created_at",
	"updated_at",
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
	child_category_keys: string[];
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
	filters: FilterState;
	categories: Category[] | null;
	districts: string[];
	isLoading: boolean;
	error: string | null;
	setCategories: (categories: Category[] | null) => void;
	setDistricts: (districts: string[]) => void;
	setInstitutions: (institutions: Institution[] | null) => void;
	setFilters: (filters: FilterState) => void;
	resetFilters: () => void;
	clearError: () => void;
	hydratePublicData: (data: {
		institutions: Institution[];
		categories: Category[];
		districts: string[];
	}) => void;
	initializePublicData: () => Promise<void>;
}
