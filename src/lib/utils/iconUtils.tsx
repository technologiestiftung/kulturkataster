import { CategoryKeys, CategoryType } from "@/types";
import React, { type FC, type SVGProps } from "react";

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
import StreetArtIcon from "@/icons/street-art.svg";
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

import { renderToStaticMarkup } from "react-dom/server";

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
	[CategoryKeys.URBAN_ART]: StreetArtIcon,
	[CategoryKeys.OTHER]: PlaceholderIcon,
	[CategoryKeys.MULTI_CATEGORIES]: MultiCategoriesIcon,
};

function svgToString(SvgComponent: SvgIconComponent): string {
	return renderToStaticMarkup(<SvgComponent />);
}

const CATEGORY_ICON_RAW_SVG_CACHE: Partial<Record<CategoryType, string>> = {};

export function getCategoryIconComponent(
	category: CategoryType,
): SvgIconComponent {
	return CATEGORY_ICON_COMPONENTS[category] ?? DefaultIcon;
}

export function getCategoryIconRawSvg(category: CategoryType): string {
	if (CATEGORY_ICON_RAW_SVG_CACHE[category]) {
		return CATEGORY_ICON_RAW_SVG_CACHE[category] as string;
	}

	const IconComponent = getCategoryIconComponent(category);
	const svgString = svgToString(IconComponent);

	CATEGORY_ICON_RAW_SVG_CACHE[category] = svgString;

	return svgString;
}
