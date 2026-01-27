import type { Prisma } from "@/generated/prisma";

export type Subcategory = Prisma.CategoryGetPayload<Prisma.CategoryDefaultArgs>;

export type Category = Partial<
	Prisma.CategoryGetPayload<Prisma.CategoryDefaultArgs>
> & {
	id: number;
	key: string;
	subcategory?: Subcategory[];
};

export type CategoryCreateInput = Prisma.CategoryCreateInput;

export type CategoryUpdateInput = Prisma.CategoryUpdateInput;

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
