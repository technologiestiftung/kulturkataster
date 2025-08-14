import { CategoryType } from "@/types";
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
	[CategoryType.STUDIOS]: StudiosIcon,
	[CategoryType.EDUCATION_PLACES]: EducationPlacesIcon,
	[CategoryType.LIBRARIES]: LibrariesIcon,
	[CategoryType.CLUBS_MUSIC_VENUES]: ClubsMusicVenuesIcon,
	[CategoryType.GALLERIES]: GalleriesIcon,
	[CategoryType.CINEMAS]: CinemasIcon,
	[CategoryType.LITERATURE_PLACES]: LiteraturePlacesIcon,
	[CategoryType.MUSEUMS]: MuseumsIcon,
	[CategoryType.CULTURAL_URBAN_DEVELOPMENT]: CulturalUrbanDevelopmentIcon,
	[CategoryType.POTENTIAL_SPACES]: PotentialSpacesIcon,
	[CategoryType.REHEARSAL_ROOMS]: RehearsalRoomsIcon,
	[CategoryType.PROJECT_SPACES_INITIATIVES]: ProjectSpacesInitiativesIcon,
	[CategoryType.SOCIOCULTURAL_CENTERS]: SocioculturalCentersIcon,
	[CategoryType.DANCE_VENUES]: DanceVenuesIcon,
	[CategoryType.PERFORMING_ARTS_VENUES]: PerformingArtsVenuesIcon,
	[CategoryType.GRAFFITI_AREAS]: GraffitiAreasIcon,
	[CategoryType.OTHER]: PlaceholderIcon,
	[CategoryType.MULTI_CATEGORIES]: MultiCategoriesIcon,
};

const CATEGORY_ICON_RAW_SVG: Partial<Record<CategoryType, string>> = {
	[CategoryType.STUDIOS]: studiosRaw,
	[CategoryType.EDUCATION_PLACES]: educationPlacesRaw,
	[CategoryType.LIBRARIES]: librariesRaw,
	[CategoryType.CLUBS_MUSIC_VENUES]: clubsMusicVenuesRaw,
	[CategoryType.GALLERIES]: galleriesRaw,
	[CategoryType.CINEMAS]: cinemasRaw,
	[CategoryType.LITERATURE_PLACES]: literaturePlacesRaw,
	[CategoryType.MUSEUMS]: museumsRaw,
	[CategoryType.CULTURAL_URBAN_DEVELOPMENT]: culturalUrbanDevelopmentRaw,
	[CategoryType.POTENTIAL_SPACES]: potentialSpacesRaw,
	[CategoryType.REHEARSAL_ROOMS]: rehearsalRoomsRaw,
	[CategoryType.PROJECT_SPACES_INITIATIVES]: projectSpacesInitiativesRaw,
	[CategoryType.SOCIOCULTURAL_CENTERS]: socioculturalCentersRaw,
	[CategoryType.DANCE_VENUES]: danceVenuesRaw,
	[CategoryType.PERFORMING_ARTS_VENUES]: performingArtsVenuesRaw,
	[CategoryType.GRAFFITI_AREAS]: graffitiAreasRaw,
	[CategoryType.OTHER]: placeholderRaw,
	[CategoryType.MULTI_CATEGORIES]: multiCategoriesRaw,
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
