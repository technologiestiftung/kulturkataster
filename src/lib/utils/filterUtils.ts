import { Category, FilterState, Subcategory } from "@/types";

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
	const filtered = category.subcategory.filter(filterFn);
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
