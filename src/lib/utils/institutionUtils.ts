import { Address } from "@/generated/prisma";
import { Institution } from "@/types";
import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import {
	getParentCategories as getParentCategoriesFromCategoryUtils,
	getSubcategories as getSubcategoriesFromCategoryUtils,
	getSubcategoriesForCategory as getSubcategoriesForCategoryFromCategoryUtils,
} from "@/lib/utils/categoryUtils";

export const toFeatureCollection = (
	institutions: Institution[],
): FeatureCollection<Geometry, GeoJsonProperties> => ({
	type: "FeatureCollection",
	features: institutions
		.map((institution) => ({
			institution,
			coordinates: getCoordinatesFromAddress(institution.address),
		}))
		.filter((item) => !!item.coordinates)
		.map((item) => ({
			type: "Feature",
			id: item.institution.id,
			geometry: {
				type: "Point",
				coordinates: item.coordinates as [number, number],
			},
			properties: {
				...item.institution,
				categories: getParentCategories(item.institution),
				subcategories: getSubcategories(item.institution),
			},
		})),
});

export const getParentCategories = (institution: Partial<Institution>) =>
	getParentCategoriesFromCategoryUtils(institution);

export const getSubcategories = (institution: Partial<Institution>) =>
	getSubcategoriesFromCategoryUtils(institution);

export const getSubcategoriesForCategory = (
	institution: Partial<Institution>,
	categoryId: number,
) => getSubcategoriesForCategoryFromCategoryUtils(institution, categoryId);

export const getCoordinatesFromAddress = (
	address: Address | null | undefined,
): [number, number] | null => {
	if (!address) {
		return null;
	}
	const lat = address.lat;
	const lng = address.lng;
	if (lat === null || lat === undefined || lng === null || lng === undefined) {
		return null;
	}
	return [Number(lng), Number(lat)];
};

export const formatInstitutionDate = (value?: Date | string | null) => {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleDateString();
};

export const formatInstitutionBoolean = (
	value: boolean | null | undefined,
	t: (key: string) => string,
) => {
	if (value === true) return t("field_names.shared_use_allowed.options.yes");
	if (value === false) return t("field_names.shared_use_allowed.options.no");
	return "—";
};

export const joinInstitutionIds = (values?: Array<number | string> | null) =>
	values && values.length > 0 ? values.join(", ") : "—";
