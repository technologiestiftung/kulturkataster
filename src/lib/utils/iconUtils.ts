import AteliersIcon from "@/icons/ateliers.svg";
import EducationalVenuesIcon from "@/icons/ausbildungsorte.svg";
import LibrariesIcon from "@/icons/bibliothek.svg";
import BookStoresIcon from "@/icons/buchhandlung.svg";
import GalleriesIcon from "@/icons/galerien.svg";
import CinemasIcon from "@/icons/kinos.svg";
import CulturalDevelopmentSitesIcon from "@/icons/kulturelle-stadtentwicklung.svg";
import MultiCategoriesIcon from "@/icons/multi-categories.svg";
import MuseumsIcon from "@/icons/museen.svg";
import DefaultIcon from "@/icons/placeholder.svg"; // Simplified import
import RehearsalSpacesIcon from "@/icons/proberäume.svg";
import ProjectSpacesAndInitiativesIcon from "@/icons/projekträume.svg";
import type { FC, SVGProps } from "react";

// Import SVGs as raw strings for the POI generator
// The `?raw` suffix tells the bundler to import the file content as a string.
import ateliersRaw from "@/icons/ateliers.svg?raw";
import educationalVenuesRaw from "@/icons/ausbildungsorte.svg?raw";
import librariesRaw from "@/icons/bibliothek.svg?raw";
import bookStoresRaw from "@/icons/buchhandlung.svg?raw";
import galleriesRaw from "@/icons/galerien.svg?raw";
import cinemasRaw from "@/icons/kinos.svg?raw";
import culturalDevelopmentSitesRaw from "@/icons/kulturelle-stadtentwicklung.svg?raw";
import multiCategoriesRaw from "@/icons/multi-categories.svg?raw";
import museumsRaw from "@/icons/museen.svg?raw";
import defaultRaw from "@/icons/placeholder.svg?raw";
import rehearsalSpacesRaw from "@/icons/proberäume.svg?raw";
import projectSpacesAndInitiativesRaw from "@/icons/projekträume.svg?raw";

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
}

type SvgIconComponent = FC<SVGProps<SVGSVGElement>>;

export const CATEGORY_ICON_COMPONENTS: Partial<
	Record<CategoryType, SvgIconComponent>
> = {
	[CategoryType.WORKSHOPS]: AteliersIcon,
	[CategoryType.EDUCATION_PLACES]: EducationalVenuesIcon,
	[CategoryType.LIBRARIES]: LibrariesIcon,
	[CategoryType.BOOKSTORES]: BookStoresIcon,
	[CategoryType.MUSIC_VENUES]: CinemasIcon, // Placeholder - you may want to update this
	[CategoryType.GALLERIES]: GalleriesIcon,
	[CategoryType.CINEMAS]: CinemasIcon,
	[CategoryType.LITERATURE_PLACES]: LibrariesIcon, // Placeholder - you may want to update this
	[CategoryType.MUSEUMS]: MuseumsIcon,
	[CategoryType.URBAN_DEVELOPMENT]: CulturalDevelopmentSitesIcon,
	[CategoryType.POTENTIAL_SPACES]: DefaultIcon, // Placeholder - you may want to update this
	[CategoryType.REHEARSAL_ROOMS]: RehearsalSpacesIcon,
	[CategoryType.PROJECT_SPACES]: ProjectSpacesAndInitiativesIcon,
	[CategoryType.SOCIOCULTURAL_CENTERS]: DefaultIcon, // Placeholder - you may want to update this
	[CategoryType.PERFORMING_ARTS]: DefaultIcon, // Placeholder - you may want to update this
	[CategoryType.OTHER]: MultiCategoriesIcon,
};

const CATEGORY_ICON_RAW_SVG: Partial<Record<CategoryType, string>> = {
	[CategoryType.WORKSHOPS]: ateliersRaw,
	[CategoryType.EDUCATION_PLACES]: educationalVenuesRaw,
	[CategoryType.LIBRARIES]: librariesRaw,
	[CategoryType.BOOKSTORES]: bookStoresRaw,
	[CategoryType.MUSIC_VENUES]: cinemasRaw, // Placeholder - you may want to update this
	[CategoryType.GALLERIES]: galleriesRaw,
	[CategoryType.CINEMAS]: cinemasRaw,
	[CategoryType.LITERATURE_PLACES]: librariesRaw, // Placeholder - you may want to update this
	[CategoryType.MUSEUMS]: museumsRaw,
	[CategoryType.URBAN_DEVELOPMENT]: culturalDevelopmentSitesRaw,
	[CategoryType.POTENTIAL_SPACES]: defaultRaw, // Placeholder - you may want to update this
	[CategoryType.REHEARSAL_ROOMS]: rehearsalSpacesRaw,
	[CategoryType.PROJECT_SPACES]: projectSpacesAndInitiativesRaw,
	[CategoryType.SOCIOCULTURAL_CENTERS]: defaultRaw, // Placeholder - you may want to update this
	[CategoryType.PERFORMING_ARTS]: defaultRaw, // Placeholder - you may want to update this
	[CategoryType.OTHER]: multiCategoriesRaw,
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
