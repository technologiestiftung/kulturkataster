import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { Database } from "./supabase";

export interface Institution {
	id: number;
	name: string;
	street: string;
	street_number: string;
	zip_code: string;
	city?: { name: string };
	district?: { name: string };
	neighbourhood?: { name: string };
	case?: string;
	latlong: string;
	st_asgeojson?: string;
}

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

// export interface Category {
// 	id: number;
// 	key: CategoryType;
// 	created_at?: string;
// }

export type Category = Database["public"]["Tables"]["category"]["Row"] & {
	subcategory: Subcategory[];
};

export type Subcategory = Database["public"]["Tables"]["subcategory"]["Row"];

export type CategoryType = Database["public"]["Enums"]["category_key_enum"] | "multi_categories";

export const CategoryKeys = {
	STUDIOS: "studios",
	EDUCATION_PLACES: "education_places",
	LIBRARIES: "libraries",
	CLUBS_MUSIC_VENUES: "clubs_music_venues",
	GALLERIES: "galleries",
	CINEMAS: "cinemas",
	LITERATURE_PLACES: "literature_places",
	MUSEUMS: "museums",
	CULTURAL_URBAN_DEVELOPMENT: "cultural_urban_development",
	POTENTIAL_SPACES: "potential_spaces",
	REHEARSAL_ROOMS: "rehearsal_rooms",
	PROJECT_SPACES_INITIATIVES: "project_spaces_initiatives",
	SOCIOCULTURAL_CENTERS: "sociocultural_centers",
	DANCE_VENUES: "dance_venues",
	PERFORMING_ARTS_VENUES: "performing_arts_venues",
	GRAFFITI_AREAS: "graffiti_areas",
	OTHER: "other",
	MULTI_CATEGORIES: "multi_categories",
} as const;

export interface District {
	city_id: number;
	created_at: string;
	id: number;
	key: string;
	name: string;
}

export interface ParentOrganization {
	id: number;
	name: string;
}

export interface CulturalArea {
	id: number;
	name: string;
}

export interface Owner {
	id: number;
	name: string;
	owner_type: string;
}

export interface Source {
	id: number;
	name: string;
}

export interface InstitutionProperties {
	id: number;
	name: string;
	tags: string[];
	email: string;
	phone: string;
	status: string;
	street: string;
	city_id: number;
	website: string;
	zip_code: string;
	categories: Category[];
	district_id: number;
	address_suffix: string;
	street_number: string;
	subcategories: Subcategory[];
	funding_sources: unknown[];
	established_since: string;
	established_until: string;
	shared_use_allowed: boolean;
	utilization_status: string;
	parent_organizations: ParentOrganization[];
	description?: string;
	funding_type?: string;
	support_type?: string;
	capacity?: number;
	rooms_count?: number;
	updated_at?: string;
	cultural_area?: CulturalArea;
	owner?: Owner;
	source?: Source;
	closing_reason?: string;
}

export interface InstitutionFeature extends InstitutionProperties {
	type: "Feature";
	geometry: {
		type: "Point";
		coordinates: [number, number];
	};
}

export interface FilterState {
	district_keys: string[];
	category_keys: string[];
	subcategory_keys: string[];
	include_closed: boolean;
}

export interface InstitutionStoreState {
	institutions: FeatureCollection<Geometry, GeoJsonProperties> | null;
	originalInstitutions: FeatureCollection<Geometry, GeoJsonProperties> | null;
	selectedInstitutionId: number | string | null;
	filters: FilterState;

	setInstitutions: (
		institutions: FeatureCollection<Geometry, GeoJsonProperties> | null,
	) => void;
	setSelectedInstitutionId: (id: string | null) => void;

	setFilters: (filters: FilterState) => void;

	initializeInstitutions: () => Promise<void>;
	applyFilters: () => Promise<void>;
	filterInstitutionsFrontend: (filters: FilterState) => Promise<void>;
}
