import { Address } from "@/generated/prisma";
import { Institution } from "@/types";
import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

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

export const getParentCategories = (institution: Institution) =>
	institution.categories?.filter((category) => !category.parent_category_id) ||
	[];

export const getSubcategories = (institution: Institution) =>
	institution.categories?.filter((category) => !!category.parent_category_id) ||
	[];

export const getSubcategoriesForCategory = (
	institution: Institution,
	categoryId: number,
) =>
	getSubcategories(institution).filter(
		(subcategory) => subcategory.parent_category_id === categoryId,
	);

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
