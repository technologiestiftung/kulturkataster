import type { FilterState } from "@/types";

export const defaultFilterState: FilterState = {
	district_keys: [],
	category_keys: [],
	subcategory_keys: [],
	include_closed: false,
	status: undefined,
};
