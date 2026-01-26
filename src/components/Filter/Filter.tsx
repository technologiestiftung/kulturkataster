"use client";

import { useInstitutionStore } from "@/lib/store/institutionStore";
import { FC, useCallback } from "react";
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
		categories,
		districts,
		initializeCategories,
		initializeDistricts,
	} = useInstitutionStore();

	const loading = categories === null || districts.length === 0;

	const retry = useCallback(() => {
		initializeCategories();
		initializeDistricts();
	}, [initializeCategories, initializeDistricts]);

	const updateFilters = (newFilters: FilterState) => {
		setFilters(newFilters);
	};

	return (
		<FilterPanel
			filters={filters}
			categoryGroups={categories ?? []}
			districts={districts}
			filteredCount={filteredInstitutions?.length ?? 0}
			categoryCounts={categoryCounts}
			subcategoryCounts={subcategoryCounts}
			loading={loading}
			error={null}
			onRetry={retry}
			onFiltersChange={updateFilters}
		/>
	);
};

export default Filter;
