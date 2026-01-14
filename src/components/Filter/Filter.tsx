"use client";

import { useInstitutionStore } from "@/lib/store/institutionStore";
import { FC } from "react";
import { useFilterData } from "./hooks/useFilterData";
import { FilterState } from "@/types";
import { FilterPanel } from "./FilterPanel";

// Main Filter Component
const Filter: FC = () => {
	const {
		setFilters,
		filters,
		filteredInstitutions,
		categoryCounts,
		subcategoryCounts,
	} = useInstitutionStore();
	const { categoryGroups, districts, loading, error, retry } = useFilterData();
	const updateFilters = (newFilters: FilterState) => {
		setFilters(newFilters);
	};

	return (
		<FilterPanel
			filters={filters}
			categoryGroups={categoryGroups}
			districts={districts}
			filteredCount={filteredInstitutions?.length ?? 0}
			categoryCounts={categoryCounts}
			subcategoryCounts={subcategoryCounts}
			loading={loading}
			error={error}
			onRetry={retry}
			onFiltersChange={updateFilters}
		/>
	);
};

export default Filter;
