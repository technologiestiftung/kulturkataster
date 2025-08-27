import { FilterState } from "@/types";

export const hasActiveFilters = (filters: FilterState | null): boolean => {
	if (!filters) return false;
	return (
		filters.district_keys.length > 0 ||
		filters.category_keys.length > 0 ||
		filters.subcategory_keys.length > 0 ||
		filters.include_closed !== undefined
	);
};
