import {
	getCategoriesWithSubcategories,
	getInstitutionsGeoJSON,
} from "@/lib/supabase/api";
import { Institution, InstitutionStoreState } from "@/types";
import { FeatureCollection } from "geojson";
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import {
	matchesCategoryFilter,
	matchesDistrictFilter,
	matchesStatusFilter,
	matchesSubcategoryFilter,
} from "../utils/filterUtils";

const computeCounts = (state: InstitutionStoreState) => {
	const { allInstitutions, categories, filters } = state;

	const categoryCounts: Record<string, number> = {};
	const subcategoryCounts: Record<string, number> = {};

	if (!allInstitutions?.features || !categories) {
		return { categoryCounts, subcategoryCounts };
	}

	// Initialize counts
	categories.forEach((category) => {
		categoryCounts[category.key] = 0;
		(category.subcategory || []).forEach((sub) => {
			subcategoryCounts[sub.key] = 0;
		});
	});

	// Count institutions that match non-category filters
	allInstitutions.features.forEach((feature) => {
		const properties = feature.properties as Institution;
		if (!properties) return;

		// Apply non-category filters (district, status, etc.)
		if (!matchesStatusFilter(properties, filters.include_closed)) return;
		if (!matchesDistrictFilter(properties, filters.district_keys)) return;

		// Count categories
		properties.categories?.forEach((cat: { key: string }) => {
			if (categoryCounts.hasOwnProperty(cat.key)) {
				categoryCounts[cat.key]++;
			}
		});

		// Count subcategories
		properties.subcategories?.forEach((sub: { key: string }) => {
			if (subcategoryCounts.hasOwnProperty(sub.key)) {
				subcategoryCounts[sub.key]++;
			}
		});
	});

	return { categoryCounts, subcategoryCounts };
};

const computeFilteredInstitutions = (
	state: InstitutionStoreState,
): FeatureCollection | null => {
	const { allInstitutions, filters } = state;

	if (!allInstitutions?.features) return null;

	const hasFilters =
		filters.district_keys.length > 0 ||
		filters.category_keys.length > 0 ||
		filters.subcategory_keys.length > 0 ||
		!filters.include_closed;

	if (!hasFilters) return allInstitutions;

	const filteredFeatures = allInstitutions.features.filter((feature) => {
		const properties = feature.properties as Institution;
		if (!properties) return false;

		if (!matchesStatusFilter(properties, filters.include_closed)) return false;
		if (!matchesDistrictFilter(properties, filters.district_keys)) return false;

		const hasCategoryFilters =
			filters.category_keys.length > 0 || filters.subcategory_keys.length > 0;

		if (hasCategoryFilters) {
			return (
				matchesCategoryFilter(properties, filters.category_keys) ||
				matchesSubcategoryFilter(properties, filters.subcategory_keys)
			);
		}

		return true;
	});

	return {
		type: "FeatureCollection",
		features: filteredFeatures,
	} as FeatureCollection;
};

export const useInstitutionStore = create<InstitutionStoreState>()(
	subscribeWithSelector(
		devtools((set, get) => ({
			allInstitutions: null,
			filteredInstitutions: null,
			categoryCounts: {},
			subcategoryCounts: {},
			selectedInstitutionId: null,
			setSelectedInstitutionId: (id: string | null) =>
				set({ selectedInstitutionId: id }),
			filters: {
				status: undefined, // e.g., "open", "closed", etc.
				district_keys: [],
				category_keys: [],
				subcategory_keys: [],
				include_closed: false,
			},
			setFilters: (filters) => {
				const newState = { filters };
				const currentState = { ...get(), ...newState };
				const filteredInstitutions = computeFilteredInstitutions(currentState);
				const { categoryCounts, subcategoryCounts } =
					computeCounts(currentState);
				set({
					...newState,
					filteredInstitutions,
					categoryCounts,
					subcategoryCounts,
				});
			},
			categories: null,
			setCategories: (categories) => set({ categories }),
			initializeCategories: async () => {
				const categories = await getCategoriesWithSubcategories();
				const currentState = { ...get(), categories };
				const { categoryCounts, subcategoryCounts } =
					computeCounts(currentState);
				set({
					categories,
					categoryCounts,
					subcategoryCounts,
				});
			},
			initializeInstitutions: async () => {
				try {
					const institutionsData = await getInstitutionsGeoJSON();
					const newState = { allInstitutions: institutionsData };
					const currentState = { ...get(), ...newState };
					const filteredInstitutions =
						computeFilteredInstitutions(currentState);
					const stateWithFiltered = { ...currentState, filteredInstitutions };
					const { categoryCounts, subcategoryCounts } =
						computeCounts(stateWithFiltered);
					set({
						...newState,
						filteredInstitutions,
						categoryCounts,
						subcategoryCounts,
					});
				} catch (error) {
					console.error("Failed to initialize institutions:", error);
				}
			},
			setInstitutions: (institutions) => {
				const newState = { allInstitutions: institutions };
				const currentState = { ...get(), ...newState };
				const filteredInstitutions = computeFilteredInstitutions(currentState);
				const stateWithFiltered = { ...currentState, filteredInstitutions };
				const { categoryCounts, subcategoryCounts } =
					computeCounts(stateWithFiltered);
				set({
					...newState,
					filteredInstitutions,
					categoryCounts,
					subcategoryCounts,
				});
			},
		})),
	),
);
