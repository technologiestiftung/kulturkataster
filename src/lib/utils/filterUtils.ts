import { FilterState, InstitutionProperties } from "@/types";

export const hasActiveFilters = (filters: FilterState | null): boolean => {
	if (!filters) return false;
	return (
		filters.district_keys.length > 0 ||
		filters.category_keys.length > 0 ||
		filters.subcategory_keys.length > 0 ||
		filters.include_closed !== undefined
	);
};

export const matchesDistrictFilter = (
	properties: InstitutionProperties,
	districtKeys: string[],
): boolean => {
	if (districtKeys.length === 0) return true;

	if (!properties.district?.key) return false;

	return districtKeys.includes(properties.district.key);
};

export const matchesCategoryFilter = (
	properties: InstitutionProperties,
	categoryKeys: string[],
): boolean => {
	return (
		properties.categories?.some((category) =>
			categoryKeys.includes(category.key),
		) || false
	);
};

export const matchesSubcategoryFilter = (
	properties: InstitutionProperties,
	subcategoryKeys: string[],
): boolean => {
	const hasExplicitMatch = properties.subcategories?.some((subcategory) =>
		subcategoryKeys.includes(subcategory.key),
	);

	return hasExplicitMatch || false;
};

export const matchesStatusFilter = (
	properties: InstitutionProperties,
	includeClosedFilter: boolean,
): boolean => {
	if (
		!includeClosedFilter &&
		properties.utilization_status === "permanently_closed"
	) {
		return false;
	}
	return true;
};
