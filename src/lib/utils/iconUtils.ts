import { CategoryKeys, CategoryType } from "@/types";
import type { FC, SVGProps } from "react";

import CinemasIcon from "@/icons/cinemas.svg";
import ClubsMusicVenuesIcon from "@/icons/clubs-music-venues.svg";
import CulturalUrbanDevelopmentIcon from "@/icons/cultural-urban-development.svg";
import DanceVenuesIcon from "@/icons/dance-venues.svg";
import EducationPlacesIcon from "@/icons/education-places.svg";
import GalleriesIcon from "@/icons/galleries.svg";
import GraffitiAreasIcon from "@/icons/graffiti-areas.svg";
import LibrariesIcon from "@/icons/libraries.svg";
import LiteraturePlacesIcon from "@/icons/literature-places.svg";
import MultiCategoriesIcon from "@/icons/multi-categories.svg";
import MuseumsIcon from "@/icons/museums.svg";
import PerformingArtsVenuesIcon from "@/icons/performing-arts-venues.svg";
import {
	default as DefaultIcon,
	default as PlaceholderIcon,
} from "@/icons/placeholder.svg";
import PotentialSpacesIcon from "@/icons/potential-spaces.svg";
import ProjectSpacesInitiativesIcon from "@/icons/project-spaces-initiatives.svg";
import RehearsalRoomsIcon from "@/icons/rehearsal-rooms.svg";
import SocioculturalCentersIcon from "@/icons/sociocultural-centers.svg";
import StudiosIcon from "@/icons/studios.svg";

import cinemasRaw from "@/icons/cinemas.svg?raw";
import clubsMusicVenuesRaw from "@/icons/clubs-music-venues.svg?raw";
import culturalUrbanDevelopmentRaw from "@/icons/cultural-urban-development.svg?raw";
import danceVenuesRaw from "@/icons/dance-venues.svg?raw";
import educationPlacesRaw from "@/icons/education-places.svg?raw";
import galleriesRaw from "@/icons/galleries.svg?raw";
import graffitiAreasRaw from "@/icons/graffiti-areas.svg?raw";
import librariesRaw from "@/icons/libraries.svg?raw";
import literaturePlacesRaw from "@/icons/literature-places.svg?raw";
import multiCategoriesRaw from "@/icons/multi-categories.svg?raw";
import museumsRaw from "@/icons/museums.svg?raw";
import performingArtsVenuesRaw from "@/icons/performing-arts-venues.svg?raw";
import {
	default as defaultRaw,
	default as placeholderRaw,
} from "@/icons/placeholder.svg?raw";
import potentialSpacesRaw from "@/icons/potential-spaces.svg?raw";
import projectSpacesInitiativesRaw from "@/icons/project-spaces-initiatives.svg?raw";
import rehearsalRoomsRaw from "@/icons/rehearsal-rooms.svg?raw";
import socioculturalCentersRaw from "@/icons/sociocultural-centers.svg?raw";
import studiosRaw from "@/icons/studios.svg?raw";

type SvgIconComponent = FC<SVGProps<SVGSVGElement>>;

export const CATEGORY_ICON_COMPONENTS: Partial<
	Record<CategoryType, SvgIconComponent>
> = {
	[CategoryKeys.STUDIOS]: StudiosIcon,
	[CategoryKeys.EDUCATION_PLACES]: EducationPlacesIcon,
	[CategoryKeys.LIBRARIES]: LibrariesIcon,
	[CategoryKeys.CLUBS_MUSIC_VENUES]: ClubsMusicVenuesIcon,
	[CategoryKeys.GALLERIES]: GalleriesIcon,
	[CategoryKeys.CINEMAS]: CinemasIcon,
	[CategoryKeys.LITERATURE_PLACES]: LiteraturePlacesIcon,
	[CategoryKeys.MUSEUMS]: MuseumsIcon,
	[CategoryKeys.CULTURAL_URBAN_DEVELOPMENT]: CulturalUrbanDevelopmentIcon,
	[CategoryKeys.POTENTIAL_SPACES]: PotentialSpacesIcon,
	[CategoryKeys.REHEARSAL_ROOMS]: RehearsalRoomsIcon,
	[CategoryKeys.PROJECT_SPACES_INITIATIVES]: ProjectSpacesInitiativesIcon,
	[CategoryKeys.SOCIOCULTURAL_CENTERS]: SocioculturalCentersIcon,
	[CategoryKeys.DANCE_VENUES]: DanceVenuesIcon,
	[CategoryKeys.PERFORMING_ARTS_VENUES]: PerformingArtsVenuesIcon,
	[CategoryKeys.GRAFFITI_AREAS]: GraffitiAreasIcon,
	[CategoryKeys.OTHER]: PlaceholderIcon,
	// [CategoryKeys.MULTI_CATEGORIES]: MultiCategoriesIcon,
};

const CATEGORY_ICON_RAW_SVG: Partial<Record<CategoryType, string>> = {
	[CategoryKeys.STUDIOS]: studiosRaw,
	[CategoryKeys.EDUCATION_PLACES]: educationPlacesRaw,
	[CategoryKeys.LIBRARIES]: librariesRaw,
	[CategoryKeys.CLUBS_MUSIC_VENUES]: clubsMusicVenuesRaw,
	[CategoryKeys.GALLERIES]: galleriesRaw,
	[CategoryKeys.CINEMAS]: cinemasRaw,
	[CategoryKeys.LITERATURE_PLACES]: literaturePlacesRaw,
	[CategoryKeys.MUSEUMS]: museumsRaw,
	[CategoryKeys.CULTURAL_URBAN_DEVELOPMENT]: culturalUrbanDevelopmentRaw,
	[CategoryKeys.POTENTIAL_SPACES]: potentialSpacesRaw,
	[CategoryKeys.REHEARSAL_ROOMS]: rehearsalRoomsRaw,
	[CategoryKeys.PROJECT_SPACES_INITIATIVES]: projectSpacesInitiativesRaw,
	[CategoryKeys.SOCIOCULTURAL_CENTERS]: socioculturalCentersRaw,
	[CategoryKeys.DANCE_VENUES]: danceVenuesRaw,
	[CategoryKeys.PERFORMING_ARTS_VENUES]: performingArtsVenuesRaw,
	[CategoryKeys.GRAFFITI_AREAS]: graffitiAreasRaw,
	[CategoryKeys.OTHER]: placeholderRaw,
	// [CategoryKeys.MULTI_CATEGORIES]: multiCategoriesRaw,
};

export function getCategoryIconComponent(
	category: CategoryType,
): SvgIconComponent {
	return CATEGORY_ICON_COMPONENTS[category] ?? DefaultIcon;
}

export function getCategoryIconRawSvg(category: CategoryType): string {
	if (CATEGORY_ICON_RAW_SVG[category]) {
		return CATEGORY_ICON_RAW_SVG[category] as string;
	}
	return defaultRaw;
}
