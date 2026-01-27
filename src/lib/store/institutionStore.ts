import { getDistricts } from "@/server/actions/addresses";
import { getCategoriesWithSubcategories } from "@/server/actions/categories";
import { getInstitutions } from "@/server/actions/institutions";
import { Institution, InstitutionStoreState } from "@/types";
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import {
	matchesCategoryFilter,
	matchesDistrictFilter,
	matchesStatusFilter,
	matchesSubcategoryFilter,
} from "../utils/filterUtils";
import {
	getParentCategories,
	getSubcategories,
	toFeatureCollection,
} from "../utils/institutionUtils";

const matchesBaseFilters = (
	institution: Institution,
	filters: InstitutionStoreState["filters"],
): boolean => {
	return (
		matchesStatusFilter(institution, filters.include_closed) &&
		matchesDistrictFilter(institution, filters.district_keys)
	);
};

const matchesCategoryFilters = (
	institution: Institution,
	filters: InstitutionStoreState["filters"],
): boolean => {
	const hasCategoryFilters =
		filters.category_keys.length > 0 || filters.subcategory_keys.length > 0;

	if (!hasCategoryFilters) return true;

	return (
		matchesCategoryFilter(institution, filters.category_keys) ||
		matchesSubcategoryFilter(institution, filters.subcategory_keys)
	);
};

const computeCounts = (state: InstitutionStoreState) => {
	const { allInstitutions, categories, filters } = state;

	const categoryCounts: Record<string, number> = {};
	const subcategoryCounts: Record<string, number> = {};

	if (!allInstitutions || !categories) {
		return { categoryCounts, subcategoryCounts };
	}

	categories.forEach((category) => {
		categoryCounts[category.key] = 0;
		(category.subcategory || []).forEach((sub) => {
			subcategoryCounts[sub.key] = 0;
		});
	});

	allInstitutions.forEach((institution) => {
		if (!matchesBaseFilters(institution, filters)) return;

		getParentCategories(institution).forEach((cat) => {
			if (Object.prototype.hasOwnProperty.call(categoryCounts, cat.key)) {
				categoryCounts[cat.key]++;
			}
		});

		getSubcategories(institution).forEach((sub) => {
			if (Object.prototype.hasOwnProperty.call(subcategoryCounts, sub.key)) {
				subcategoryCounts[sub.key]++;
			}
		});
	});

	return { categoryCounts, subcategoryCounts };
};

const computeFilteredInstitutions = (
	state: InstitutionStoreState,
): Institution[] | null => {
	const { allInstitutions, filters } = state;

	if (!allInstitutions) return null;

	return allInstitutions.filter(
		(institution) =>
			matchesBaseFilters(institution, filters) &&
			matchesCategoryFilters(institution, filters),
	);
};

export const useInstitutionStore = create<InstitutionStoreState>()(
	subscribeWithSelector(
		devtools((set, get) => ({
			allInstitutions: null,
			filteredInstitutions: null,
			allInstitutionsGeoJSON: null,
			filteredInstitutionsGeoJSON: null,
			categoryCounts: {},
			subcategoryCounts: {},
			districts: [],
			selectedInstitutionId: null,
			setSelectedInstitutionId: (id: string | number | null) =>
				set({ selectedInstitutionId: id }),
			filters: {
				status: undefined,
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
				const filteredInstitutionsGeoJSON = filteredInstitutions
					? toFeatureCollection(filteredInstitutions)
					: null;
				set({
					...newState,
					filteredInstitutions,
					filteredInstitutionsGeoJSON,
					categoryCounts,
					subcategoryCounts,
				});
			},
			categories: null,
			setCategories: (categories) => set({ categories }),
			initializeDistricts: async () => {
				const districts = await getDistricts();
				set({ districts });
			},
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
					const institutionsData = await getInstitutions();
					const newState = { allInstitutions: institutionsData };
					const currentState = { ...get(), ...newState };
					const filteredInstitutions =
						computeFilteredInstitutions(currentState);
					const allInstitutionsGeoJSON =
						institutionsData && institutionsData.length > 0
							? toFeatureCollection(institutionsData)
							: null;
					const filteredInstitutionsGeoJSON = filteredInstitutions
						? toFeatureCollection(filteredInstitutions)
						: null;

					const stateWithFiltered = {
						...currentState,
						filteredInstitutions,
						allInstitutionsGeoJSON,
						filteredInstitutionsGeoJSON,
					};
					const { categoryCounts, subcategoryCounts } =
						computeCounts(stateWithFiltered);
					set({
						...newState,
						filteredInstitutions,
						allInstitutionsGeoJSON,
						filteredInstitutionsGeoJSON,
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
				const allInstitutionsGeoJSON = institutions
					? toFeatureCollection(institutions)
					: null;
				const filteredInstitutionsGeoJSON = filteredInstitutions
					? toFeatureCollection(filteredInstitutions)
					: null;
				const stateWithFiltered = {
					...currentState,
					filteredInstitutions,
					allInstitutionsGeoJSON,
					filteredInstitutionsGeoJSON,
				};
				const { categoryCounts, subcategoryCounts } =
					computeCounts(stateWithFiltered);
				set({
					...newState,
					filteredInstitutions,
					allInstitutionsGeoJSON,
					filteredInstitutionsGeoJSON,
					categoryCounts,
					subcategoryCounts,
				});
			},
		})),
	),
);
