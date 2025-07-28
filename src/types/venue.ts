export enum CategoryType {
	WORKSHOPS = "workshops",
	EDUCATION_PLACES = "education_places",
	LIBRARIES = "libraries",
	BOOKSTORES = "bookstores",
	MUSIC_VENUES = "music_venues",
	GALLERIES = "galleries",
	CINEMAS = "cinemas",
	LITERATURE_PLACES = "literature_places",
	MUSEUMS = "museums",
	URBAN_DEVELOPMENT = "urban_development",
	POTENTIAL_SPACES = "potential_spaces",
	REHEARSAL_ROOMS = "rehearsal_rooms",
	PROJECT_SPACES = "project_spaces",
	SOCIOCULTURAL_CENTERS = "sociocultural_centers",
	PERFORMING_ARTS = "performing_arts",
	OTHER = "other",
	MULTI_CATEGORIES = "multi_categories",
}
export interface Category {
	id: number;
	key: CategoryType;
}

export interface ParentOrganization {
	id: number;
	name: string;
}

export interface VenueProperties {
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
	street_number: string;
	subcategories: Category[];
	funding_sources: unknown[];
	established_since: string;
	shared_use_allowed: boolean;
	utilization_status: string;
	parent_organizations: ParentOrganization[];
	description?: string;
	funding_type?: string;
	support_type?: string;
	capacity?: number;
	rooms_count?: number;
}

export interface VenueFeature extends VenueProperties {
	type: "Feature";
	geometry: {
		type: "Point";
		coordinates: [number, number];
	};
}

export interface VenueStoreState {
	selectedVenueId: string | null;
	setSelectedVenueId: (id: string | null) => void;
}
