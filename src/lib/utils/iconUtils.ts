import AteliersIcon from "@/icons/ateliers.svg";
import EducationalVenuesIcon from "@/icons/ausbildungsorte.svg";
import LibrariesIcon from "@/icons/bibliothek.svg";
import BookStoresIcon from "@/icons/buchhandlung.svg";
import {
	default as ClubsAndMusicVenuesIcon,
	default as DefaultIcon,
	default as LiteraryVenuesIcon,
	default as PerformanceDanceAndArtsVenuesIcon,
	default as PotentialAreasIcon,
	default as PotentialLocationsIcon,
	default as PublicMuseumsIcon,
	default as SocioculturalCentersIcon,
} from "@/icons/default.svg";
import GalleriesIcon from "@/icons/galerien.svg";
import CinemasIcon from "@/icons/kinos.svg";
import CulturalDevelopmentSitesIcon from "@/icons/kulturelle-stadtentwicklung.svg";
import MuseumsIcon from "@/icons/museen.svg";
import RehearsalSpacesIcon from "@/icons/proberäume.svg";
import ProjectSpacesAndInitiativesIcon from "@/icons/projekträume.svg";
import type { FC } from "react";
import { SVGProps } from "react";

export enum CategoryType {
	ATELIERS = "ateliers",
	EDUCATIONAL_VENUES = "educational_venues",
	LIBRARIES = "libraries",
	BOOKSTORES = "bookstores",
	CLUBS_AND_MUSIC_VENUES = "clubs_and_music_venues",
	GALLERIES = "galleries",
	CINEMAS = "cinemas",
	LITERARY_VENUES = "literary_venues",
	MUSEUMS = "museums",
	CULTURAL_DEVELOPMENT_SITES = "cultural_development_sites",
	POTENTIAL_AREAS = "potential_areas",
	REHEARSAL_SPACES = "rehearsal_spaces",
	PROJECT_SPACES_AND_INITIATIVES = "project_spaces_and_initiatives",
	SOCIOCULTURAL_CENTERS = "sociocultural_centers",
	PERFORMANCE_DANCE_AND_ARTS_VENUES = "performance_dance_and_arts_venues",
	PUBLIC_MUSEUMS = "public_museums",
	POTENTIAL_LOCATIONS = "potential_locations",
}

type SvgIconComponent = FC<SVGProps<SVGSVGElement>>;

export const CATEGORY_ICONS: Record<CategoryType, SvgIconComponent> = {
	[CategoryType.ATELIERS]: AteliersIcon,
	[CategoryType.EDUCATIONAL_VENUES]: EducationalVenuesIcon,
	[CategoryType.LIBRARIES]: LibrariesIcon,
	[CategoryType.BOOKSTORES]: BookStoresIcon,
	[CategoryType.CLUBS_AND_MUSIC_VENUES]: ClubsAndMusicVenuesIcon,
	[CategoryType.GALLERIES]: GalleriesIcon,
	[CategoryType.CINEMAS]: CinemasIcon,
	[CategoryType.LITERARY_VENUES]: LiteraryVenuesIcon,
	[CategoryType.MUSEUMS]: MuseumsIcon,
	[CategoryType.CULTURAL_DEVELOPMENT_SITES]: CulturalDevelopmentSitesIcon,
	[CategoryType.POTENTIAL_AREAS]: PotentialAreasIcon,
	[CategoryType.REHEARSAL_SPACES]: RehearsalSpacesIcon,
	[CategoryType.PROJECT_SPACES_AND_INITIATIVES]:
		ProjectSpacesAndInitiativesIcon,
	[CategoryType.SOCIOCULTURAL_CENTERS]: SocioculturalCentersIcon,
	[CategoryType.PERFORMANCE_DANCE_AND_ARTS_VENUES]:
		PerformanceDanceAndArtsVenuesIcon,
	[CategoryType.PUBLIC_MUSEUMS]: PublicMuseumsIcon,
	[CategoryType.POTENTIAL_LOCATIONS]: PotentialLocationsIcon,
};

export const GERMAN_TO_ENGLISH_CATEGORIES: Record<string, CategoryType> = {
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
};

export function getCategoryIcon(category: CategoryType): SvgIconComponent {
	return CATEGORY_ICONS[category] || DefaultIcon;
}

export function getCategoryTypeFromGerman(name: string): CategoryType | null {
	return GERMAN_TO_ENGLISH_CATEGORIES[name] || null;
}

export function getAllCategories(): CategoryType[] {
	return Object.values(CategoryType);
}

export function getCategoryIconSafe(
	category: CategoryType | string,
): SvgIconComponent {
	if (typeof category === "string") {
		const resolved = getCategoryTypeFromGerman(category);
		if (resolved) return getCategoryIcon(resolved);
		return DefaultIcon;
	}
	return getCategoryIcon(category);
}
