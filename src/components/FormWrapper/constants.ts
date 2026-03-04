import type { FilterState } from "@/types";

export const defaultFilterState: FilterState = {
	district_keys: [],
	category_keys: [],
	child_category_keys: [],
	include_closed: false,
	status: undefined,
};

export const defaultTableFilterState: FilterState = {
	...defaultFilterState,
	include_closed: true,
};
