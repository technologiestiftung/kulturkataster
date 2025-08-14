import { CategoryType } from "@/types";
import type { FC, SVGProps } from "react";

import ClubsMusicVenuesIcon from "@/icons/clubs-music-venues.svg";
import PerformingArtsVenuesIcon from "@/icons/performing-arts-venues.svg";
import StudiosIcon from "@/icons/studios.svg";
import CinemasIcon from "@/icons/cinemas.svg";
import EducationPlacesIcon from "@/icons/education-places.svg";
import GalleriesIcon from "@/icons/galleries.svg";
import LibrariesIcon from "@/icons/libraries.svg";
import LiteraturePlacesIcon from "@/icons/literature-places.svg";
import MultiCategoriesIcon from "@/icons/multi-categories.svg";
import MuseumsIcon from "@/icons/museums.svg";
import {
	default as DefaultIcon,
	default as PlaceholderIcon,
} from "@/icons/placeholder.svg";
import PotentialSpacesIcon from "@/icons/potential-spaces.svg";
import RehearsalRoomsIcon from "@/icons/rehearsal-rooms.svg";
import SocioculturalCentersIcon from "@/icons/sociocultural-centers.svg";
import clubsMusicVenuesRaw from "@/icons/clubs-music-venues.svg?raw";
import performingArtsVenuesRaw from "@/icons/performing-arts-venues.svg?raw";
import studiosRaw from "@/icons/studios.svg?raw";
import cinemasRaw from "@/icons/cinemas.svg?raw";
import educationPlacesRaw from "@/icons/education-places.svg?raw";
import galleriesRaw from "@/icons/galleries.svg?raw";
import librariesRaw from "@/icons/libraries.svg?raw";
import literaturePlacesRaw from "@/icons/literature-places.svg?raw";
import multiCategoriesRaw from "@/icons/multi-categories.svg?raw";
import museumsRaw from "@/icons/museums.svg?raw";
import {
	default as defaultRaw,
	default as placeholderRaw,
} from "@/icons/placeholder.svg?raw";
import potentialSpacesRaw from "@/icons/potential-spaces.svg?raw";
import rehearsalRoomsRaw from "@/icons/rehearsal-rooms.svg?raw";
import socioculturalCentersRaw from "@/icons/sociocultural-centers.svg?raw";

type SvgIconComponent = FC<SVGProps<SVGSVGElement>>;

// --- AKTUALISIERTES MAPPING FÜR KOMPONENTEN ---
export const CATEGORY_ICON_COMPONENTS: Partial<
	Record<CategoryType, SvgIconComponent>
> = {
	[CategoryType.STUDIOS]: StudiosIcon,
	[CategoryType.CLUBS_MUSIC_VENUES]: ClubsMusicVenuesIcon,
	[CategoryType.PERFORMING_ARTS_VENUES]: PerformingArtsVenuesIcon,
	[CategoryType.EDUCATION_PLACES]: EducationPlacesIcon,
	[CategoryType.LIBRARIES]: LibrariesIcon,
	[CategoryType.GALLERIES]: GalleriesIcon,
	[CategoryType.CINEMAS]: CinemasIcon,
	[CategoryType.LITERATURE_PLACES]: LiteraturePlacesIcon,
	[CategoryType.MUSEUMS]: MuseumsIcon,
	[CategoryType.POTENTIAL_SPACES]: PotentialSpacesIcon,
	[CategoryType.REHEARSAL_ROOMS]: RehearsalRoomsIcon,
	[CategoryType.SOCIOCULTURAL_CENTERS]: SocioculturalCentersIcon,
	[CategoryType.OTHER]: PlaceholderIcon,
	[CategoryType.MULTI_CATEGORIES]: MultiCategoriesIcon,
};

// --- AKTUALISIERTES MAPPING FÜR RAW SVG ---
const CATEGORY_ICON_RAW_SVG: Partial<Record<CategoryType, string>> = {
	[CategoryType.STUDIOS]: studiosRaw,
	[CategoryType.CLUBS_MUSIC_VENUES]: clubsMusicVenuesRaw,
	[CategoryType.PERFORMING_ARTS_VENUES]: performingArtsVenuesRaw,
	[CategoryType.EDUCATION_PLACES]: educationPlacesRaw,
	[CategoryType.LIBRARIES]: librariesRaw,
	[CategoryType.GALLERIES]: galleriesRaw,
	[CategoryType.CINEMAS]: cinemasRaw,
	[CategoryType.LITERATURE_PLACES]: literaturePlacesRaw,
	[CategoryType.MUSEUMS]: museumsRaw,
	[CategoryType.POTENTIAL_SPACES]: potentialSpacesRaw,
	[CategoryType.REHEARSAL_ROOMS]: rehearsalRoomsRaw,
	[CategoryType.SOCIOCULTURAL_CENTERS]: socioculturalCentersRaw,
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
