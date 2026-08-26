/* eslint-disable max-params */
import { Category, ChildCategory, FilterState, Institution } from "@/types";
import {
	CultureIndexRangeKey,
	getCultureIndexRangeForValue,
} from "@/lib/constants/cultureIndexRanges";
import { getParentCategories, getSubcategories } from "./institutionUtils";

export const hasActiveFilters = (filters: FilterState | null): boolean => {
	if (!filters) return false;
	return (
		filters.district_keys.length > 0 ||
		filters.category_keys.length > 0 ||
		filters.child_category_keys.length > 0 ||
		filters.culture_index_ranges.length > 0 ||
		filters.include_closed !== undefined
	);
};

export const getFilterCount = (filters: FilterState | null): number => {
	if (!filters) return 0;
	let filterCount: number = 0;
	filterCount += filters.district_keys.length;
	filterCount += filters.category_keys.length;
	filterCount += filters.child_category_keys.length;
	filterCount += filters.culture_index_ranges.length;
	if (!filters.include_closed) {
		filterCount += 1;
	}
	return filterCount;
};

export const getSortedSubcategories = (
	category: Category,
	collator: Intl.Collator,
	translateFn: (key: string) => string,
	filterFn: (subcategory: ChildCategory) => boolean,
): ChildCategory[] => {
	const filtered = category.child_categories?.filter(filterFn);
	if (!filtered) return [];
	return filtered.sort((a, b) => {
		if (a.key.includes("other") && !b.key.includes("other")) return 1;
		if (b.key.includes("other") && !a.key.includes("other")) return -1;
		return collator.compare(
			translateFn(`category.${a.key}`),
			translateFn(`category.${b.key}`),
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

	if (!properties.address?.district) return false;

	return districtKeys.includes(properties.address.district);
};

export const matchesCultureIndexFilter = (
	properties: Institution,
	rangeKeys: CultureIndexRangeKey[],
): boolean => {
	if (rangeKeys.length === 0) return true;

	const range = getCultureIndexRangeForValue(properties.culture_index);
	return range !== null && rangeKeys.includes(range);
};

export const matchesCategoryFilter = (
	properties: Institution,
	categoryKeys: string[],
): boolean => {
	return (
		getParentCategories(properties).some((category) =>
			categoryKeys.includes(category.key),
		) || false
	);
};

export const matchesSubcategoryFilter = (
	properties: Institution,
	subcategoryKeys: string[],
): boolean => {
	const hasExplicitMatch = getSubcategories(properties).some((subcategory) =>
		subcategoryKeys.includes(subcategory.key),
	);

	return hasExplicitMatch || false;
};

export const matchesStatusFilter = (
	institution: Institution,
	includeClosedFilter: boolean,
): boolean => {
	if (
		!includeClosedFilter &&
		institution.utilization_status === "permanently_closed"
	) {
		return false;
	}
	return true;
};

export const resolveCategoryIdsFromFilters = (
	filters: FilterState,
	categoryGroups: Category[],
): number[] => {
	const selectedIds = new Set<number>();
	const selectedCategoryKeys = new Set(filters.category_keys);
	const selectedSubcategoryKeys = new Set(filters.child_category_keys);

	categoryGroups.forEach((category) => {
		if (selectedCategoryKeys.has(category.key)) {
			selectedIds.add(category.id);
		}
		(category.child_categories ?? []).forEach((subcategory) => {
			if (selectedSubcategoryKeys.has(subcategory.key)) {
				selectedIds.add(subcategory.id);
			}
		});
	});

	return Array.from(selectedIds);
};
