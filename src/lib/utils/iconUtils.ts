import BookStoresIcon from "@/icons/bookstores.svg";
import CinemasIcon from "@/icons/cinemas.svg";
import EducationPlacesIcon from "@/icons/education-places.svg";
import GalleriesIcon from "@/icons/galleries.svg";
import LibrariesIcon from "@/icons/libraries.svg";
import LiteraturePlacesIcon from "@/icons/literature-places.svg";
import MultiCategoriesIcon from "@/icons/multi-categories.svg";
import MuseumsIcon from "@/icons/museums.svg";
import MusicVenuesIcon from "@/icons/music-venues.svg";
import PerformingArtsIcon from "@/icons/performing-arts.svg";
import {
	default as DefaultIcon,
	default as PlaceholderIcon,
} from "@/icons/placeholder.svg"; // Simplified import
import PotentialSpacesIcon from "@/icons/potential-spaces.svg";
import ProjectSpacesIcon from "@/icons/project-spaces.svg";
import RehearsalRoomsIcon from "@/icons/rehearsal-rooms.svg";
import SocioculturalCentersIcon from "@/icons/sociocultural-centers.svg";
import UrbanDevelopmentIcon from "@/icons/urban-development.svg";
import WorkshopsIcon from "@/icons/workshops.svg";
import type { FC, SVGProps } from "react";

// Import SVGs as raw strings for the POI generator
// The `?raw` suffix tells the bundler to import the file content as a string.
import bookStoresRaw from "@/icons/bookstores.svg?raw";
import cinemasRaw from "@/icons/cinemas.svg?raw";
import educationPlacesRaw from "@/icons/education-places.svg?raw";
import galleriesRaw from "@/icons/galleries.svg?raw";
import librariesRaw from "@/icons/libraries.svg?raw";
import literaturePlacesRaw from "@/icons/literature-places.svg?raw";
import multiCategoriesRaw from "@/icons/multi-categories.svg?raw";
import museumsRaw from "@/icons/museums.svg?raw";
import musicVenuesRaw from "@/icons/music-venues.svg?raw";
import performingArtsRaw from "@/icons/performing-arts.svg?raw";
import {
	default as defaultRaw,
	default as placeholderRaw,
} from "@/icons/placeholder.svg?raw";
import potentialSpacesRaw from "@/icons/potential-spaces.svg?raw";
import projectSpacesRaw from "@/icons/project-spaces.svg?raw";
import rehearsalRoomsRaw from "@/icons/rehearsal-rooms.svg?raw";
import socioculturalCentersRaw from "@/icons/sociocultural-centers.svg?raw";
import urbanDevelopmentRaw from "@/icons/urban-development.svg?raw";
import workshopsRaw from "@/icons/workshops.svg?raw";

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

type SvgIconComponent = FC<SVGProps<SVGSVGElement>>;

export const CATEGORY_ICON_COMPONENTS: Partial<
	Record<CategoryType, SvgIconComponent>
> = {
	[CategoryType.WORKSHOPS]: WorkshopsIcon,
	[CategoryType.EDUCATION_PLACES]: EducationPlacesIcon,
	[CategoryType.LIBRARIES]: LibrariesIcon,
	[CategoryType.BOOKSTORES]: BookStoresIcon,
	[CategoryType.MUSIC_VENUES]: MusicVenuesIcon,
	[CategoryType.GALLERIES]: GalleriesIcon,
	[CategoryType.CINEMAS]: CinemasIcon,
	[CategoryType.LITERATURE_PLACES]: LiteraturePlacesIcon,
	[CategoryType.MUSEUMS]: MuseumsIcon,
	[CategoryType.URBAN_DEVELOPMENT]: UrbanDevelopmentIcon,
	[CategoryType.POTENTIAL_SPACES]: PotentialSpacesIcon,
	[CategoryType.REHEARSAL_ROOMS]: RehearsalRoomsIcon,
	[CategoryType.PROJECT_SPACES]: ProjectSpacesIcon,
	[CategoryType.SOCIOCULTURAL_CENTERS]: SocioculturalCentersIcon,
	[CategoryType.PERFORMING_ARTS]: PerformingArtsIcon,
	[CategoryType.OTHER]: PlaceholderIcon,
	[CategoryType.MULTI_CATEGORIES]: MultiCategoriesIcon,
};

const CATEGORY_ICON_RAW_SVG: Partial<Record<CategoryType, string>> = {
	[CategoryType.WORKSHOPS]: workshopsRaw,
	[CategoryType.EDUCATION_PLACES]: educationPlacesRaw,
	[CategoryType.LIBRARIES]: librariesRaw,
	[CategoryType.BOOKSTORES]: bookStoresRaw,
	[CategoryType.MUSIC_VENUES]: musicVenuesRaw,
	[CategoryType.GALLERIES]: galleriesRaw,
	[CategoryType.CINEMAS]: cinemasRaw,
	[CategoryType.LITERATURE_PLACES]: literaturePlacesRaw,
	[CategoryType.MUSEUMS]: museumsRaw,
	[CategoryType.URBAN_DEVELOPMENT]: urbanDevelopmentRaw,
	[CategoryType.POTENTIAL_SPACES]: potentialSpacesRaw,
	[CategoryType.REHEARSAL_ROOMS]: rehearsalRoomsRaw,
	[CategoryType.PROJECT_SPACES]: projectSpacesRaw,
	[CategoryType.SOCIOCULTURAL_CENTERS]: socioculturalCentersRaw,
	[CategoryType.PERFORMING_ARTS]: performingArtsRaw,
	[CategoryType.OTHER]: placeholderRaw,
	[CategoryType.MULTI_CATEGORIES]: multiCategoriesRaw,
};

/**
 * Gets the icon as a React Component for use in the UI.
 * Falls back to a default icon if a specific one isn't mapped.
 */
export function getCategoryIconComponent(
	category: CategoryType,
): SvgIconComponent {
	return CATEGORY_ICON_COMPONENTS[category] ?? DefaultIcon;
}

/**
 * Gets the icon as a raw SVG string for custom generation.
 * Falls back to a default raw string if a specific one isn't mapped.
 */
export function getCategoryIconRawSvg(category: CategoryType): string {
	if (CATEGORY_ICON_RAW_SVG[category]) {
		return CATEGORY_ICON_RAW_SVG[category] as string;
	}

	return defaultRaw;
}
