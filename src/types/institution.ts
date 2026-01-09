import { Prisma } from "@/generated/prisma";
import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

export type PrismaInstitutionWithRelations = Prisma.InstitutionGetPayload<{
	include: {
		address: true;
		categories: true;
		contact_person: true;
		tags: true;
		users: true;
	};
}>;

export type Subcategory = Prisma.CategoryGetPayload<Prisma.CategoryDefaultArgs>;

export type Category = Partial<
	Prisma.CategoryGetPayload<Prisma.CategoryDefaultArgs>
> & {
	id: number;
	key: string;
	subcategory?: Subcategory[];
};

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
	URBAN_ART: "urban_art",
	OTHER: "other",
	MULTI_CATEGORIES: "multi_categories",
} as const;

export type CategoryType = string;

export type Institution = PrismaInstitutionWithRelations;

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
