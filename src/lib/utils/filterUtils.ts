import { Category, FilterState, Institution, Subcategory } from "@/types";

export const hasActiveFilters = (filters: FilterState | null): boolean => {
	if (!filters) return false;
	return (
		filters.district_keys.length > 0 ||
		filters.category_keys.length > 0 ||
		filters.subcategory_keys.length > 0 ||
		filters.include_closed !== undefined
	);
};

export const getSortedSubcategories = (
	category: Category,
	collator: Intl.Collator,
	translateFn: (key: string) => string,
	filterFn: (subcategory: Subcategory) => boolean,
): Subcategory[] => {
	const filtered = category.subcategory?.filter(filterFn);
	if (!filtered) return [];
	return filtered.sort((a, b) => {
		if (a.key.includes("other") && !b.key.includes("other")) return 1;
		if (b.key.includes("other") && !a.key.includes("other")) return -1;
		return collator.compare(
			translateFn(`subcategory.${a.key}`),
			translateFn(`subcategory.${b.key}`),
		);
	});
};

export const getSortedCategories = (
	categories: Category[],
	collator: Intl.Collator,
	translateFn: (key: string) => string,
): Category[] => {
	return [...categories].sort((a, b) => {
		if (a.key.includes("other") && !b.key.includes("other")) return 1;
		if (b.key.includes("other") && !a.key.includes("other")) return -1;
		return collator.compare(
			translateFn(`category.${a.key}`),
			translateFn(`category.${b.key}`),
		);
	});
};

export const matchesDistrictFilter = (
	properties: Institution,
	districtKeys: string[],
): boolean => {
	if (districtKeys.length === 0) return true;

	if (!properties.district?.key) return false;

	return districtKeys.includes(properties.district.key);
};

export const matchesCategoryFilter = (
	properties: Institution,
	categoryKeys: string[],
): boolean => {
	return (
		properties.categories?.some((category) =>
			categoryKeys.includes(category.key),
		) || false
	);
};

export const matchesSubcategoryFilter = (
	properties: Institution,
	subcategoryKeys: string[],
): boolean => {
	const hasExplicitMatch = properties.subcategories?.some((subcategory) =>
		subcategoryKeys.includes(subcategory.key),
	);

	return hasExplicitMatch || false;
};

export const matchesStatusFilter = (
	properties: Institution,
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
