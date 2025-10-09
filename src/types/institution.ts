import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { Database } from "./supabase";

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

export type Institution = Database["public"]["Tables"]["institution"]["Row"] & {
	categories: Category[];
	district: District;
	parent_organizations: ParentOrganization[]; // Renamed from 'org' to 'parent_organizations'
	cultural_areas: CulturalArea[];
	subcategories: Subcategory[];
	rooms_count: number | null;
	support_type: string | null;
	source: Source | null;
	cultural_area: CulturalArea | null;
	owner: Owner | null;
	funding_type: string | null;
	closing_reason: string | null;
	created_at: string;
	updated_at: string;
	city: City | null;
};

export type City = Database["public"]["Tables"]["city"]["Row"];

export type Category = Database["public"]["Tables"]["category"]["Row"] & {
	subcategory: Subcategory[];
};

export type Subcategory = Database["public"]["Tables"]["subcategory"]["Row"];

export type CategoryType =
	| Database["public"]["Enums"]["category_key_enum"]
	| "multi_categories";

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

export type District = Database["public"]["Tables"]["district"]["Row"];

export type ParentOrganization =
	Database["public"]["Tables"]["parent_organization"]["Row"];

export type CulturalArea = Database["public"]["Tables"]["cultural_area"]["Row"];

export type Owner = Database["public"]["Tables"]["owner"]["Row"];

export type Source = Database["public"]["Tables"]["source"]["Row"];

export interface InstitutionFeature extends Institution {
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
	status: string | undefined; // e.g., "open", "closed", etc.
}

export interface InstitutionStoreState {
	allInstitutions: FeatureCollection<Geometry, GeoJsonProperties> | null;
	filteredInstitutions: FeatureCollection<Geometry, GeoJsonProperties> | null;
	categoryCounts: Record<string, number>;
	subcategoryCounts: Record<string, number>;
	selectedInstitutionId: number | string | null;
	filters: FilterState;
	categories: Category[] | null;
	setCategories: (categories: Category[] | null) => void;
	setInstitutions: (
		institutions: FeatureCollection<Geometry, GeoJsonProperties> | null,
	) => void;
	setSelectedInstitutionId: (id: string | null) => void;

	setFilters: (filters: FilterState) => void;
	initializeCategories: () => Promise<void>;
	initializeInstitutions: () => Promise<void>;
	applyFilters: () => Promise<void>;
}
