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
	ATELIERS = "ateliers",
	EDUCATIONAL_VENUES = "educational_venues",
	LIBRARIES = "libraries",
	BOOKSTORES = "bookstores",
	CLUBS_AND_MUSIC_VENUES = "clubs_and_music_venues",
	GALLERIES = "galleries",
	CINEMAS = "cinemas",
	LITERARY_VENUES = "literary_venues",
	MUSEUMS = "museen",
	CULTURAL_DEVELOPMENT_SITES = "cultural_development_sites",
	POTENTIAL_AREAS = "potential_areas",
	REHEARSAL_SPACES = "rehearsal_spaces",
	PROJECT_SPACES_AND_INITIATIVES = "project_spaces_and_initiatives",
	SOCIOCULTURAL_CENTERS = "sociocultural_centers",
	PERFORMANCE_DANCE_AND_ARTS_VENUES = "performance_dance_and_arts_venues",
	PUBLIC_MUSEUMS = "public_museums",
	POTENTIAL_LOCATIONS = "potential_locations",
	MULTI_CATEGORIES = "multi_categories",
}

type SvgIconComponent = FC<SVGProps<SVGSVGElement>>;

export const CATEGORY_ICON_COMPONENTS: Partial<
	Record<CategoryType, SvgIconComponent>
> = {
	[CategoryType.ATELIERS]: AteliersIcon,
	[CategoryType.EDUCATIONAL_VENUES]: EducationalVenuesIcon,
	[CategoryType.LIBRARIES]: LibrariesIcon,
	[CategoryType.BOOKSTORES]: BookStoresIcon,
	[CategoryType.GALLERIES]: GalleriesIcon,
	[CategoryType.CINEMAS]: CinemasIcon,
	[CategoryType.MUSEUMS]: MuseumsIcon,
	[CategoryType.CULTURAL_DEVELOPMENT_SITES]: CulturalDevelopmentSitesIcon,
	[CategoryType.REHEARSAL_SPACES]: RehearsalSpacesIcon,
	[CategoryType.PROJECT_SPACES_AND_INITIATIVES]:
		ProjectSpacesAndInitiativesIcon,
	[CategoryType.MULTI_CATEGORIES]: MultiCategoriesIcon,
};

const CATEGORY_ICON_RAW_SVG: Partial<Record<CategoryType, string>> = {
	[CategoryType.ATELIERS]: ateliersRaw,
	[CategoryType.EDUCATIONAL_VENUES]: educationalVenuesRaw,
	[CategoryType.LIBRARIES]: librariesRaw,
	[CategoryType.BOOKSTORES]: bookStoresRaw,
	[CategoryType.GALLERIES]: galleriesRaw,
	[CategoryType.CINEMAS]: cinemasRaw,
	[CategoryType.MUSEUMS]: museumsRaw,
	[CategoryType.CULTURAL_DEVELOPMENT_SITES]: culturalDevelopmentSitesRaw,
	[CategoryType.REHEARSAL_SPACES]: rehearsalSpacesRaw,
	[CategoryType.PROJECT_SPACES_AND_INITIATIVES]: projectSpacesAndInitiativesRaw,
	[CategoryType.MULTI_CATEGORIES]: multiCategoriesRaw,
};

export const GERMAN_CATEGORY_MAP: Record<string, CategoryType> = {
	Ateliers: CategoryType.ATELIERS,
	Ausbildungsorte: CategoryType.EDUCATIONAL_VENUES,
	Bibliotheken: CategoryType.LIBRARIES,
	Buchhandlungen: CategoryType.BOOKSTORES,
	"Clubs und Musikspielstätten": CategoryType.CLUBS_AND_MUSIC_VENUES,
	Galerien: CategoryType.GALLERIES,
	Kinos: CategoryType.CINEMAS,
	Literaturorte: CategoryType.LITERARY_VENUES,
	Museen: CategoryType.MUSEUMS,
	"Orte der kulturellen Stadtentwicklung":
		CategoryType.CULTURAL_DEVELOPMENT_SITES,
	Potenzialflächen: CategoryType.POTENTIAL_AREAS,
	Proberäume: CategoryType.REHEARSAL_SPACES,
	"Projekträume und -initiativen": CategoryType.PROJECT_SPACES_AND_INITIATIVES,
	"Soziokulturelle Zentren": CategoryType.SOCIOCULTURAL_CENTERS,
	"Spielstätten Tanz und darstellende Künste":
		CategoryType.PERFORMANCE_DANCE_AND_ARTS_VENUES,
	"Öffentliche Museen": CategoryType.PUBLIC_MUSEUMS,
	Potenzialorte: CategoryType.POTENTIAL_LOCATIONS,
	"Mehrere Kategorien": CategoryType.MULTI_CATEGORIES,
};

export function getCategoryTypeFromGerman(
	name: string,
): CategoryType | undefined {
	return GERMAN_CATEGORY_MAP[name];
}

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
export function getCategoryIconRawSvg(category: CategoryType | string): string {
	let categoryType: CategoryType | undefined;
	if (typeof category === "string") {
		categoryType = getCategoryTypeFromGerman(category);
	} else {
		categoryType = category;
	}

	if (categoryType && CATEGORY_ICON_RAW_SVG[categoryType]) {
		return CATEGORY_ICON_RAW_SVG[categoryType] as string;
	}

	return defaultRaw;
}
