import { Institution, InstitutionStoreState } from "@/types";
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import {
	createEmptyCultureIndexRangeCounts,
	getCultureIndexRangeForValue,
} from "@/lib/constants/cultureIndexRanges";
import {
	matchesCategoryFilter,
	matchesCultureIndexFilter,
	matchesDistrictFilter,
	matchesStatusFilter,
	matchesSubcategoryFilter,
} from "../utils/filterUtils";
import {
	getParentCategories,
	getSubcategories,
	toFeatureCollection,
} from "../utils/institutionUtils";
import { areStoreSliceValuesEqual } from "../utils/storeEquality";
import { getPublicInstitutionData } from "@/server/actions/publicInstitutionData";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";

const defaultFilters: InstitutionStoreState["filters"] = {
	status: undefined,
	district_keys: [],
	category_keys: [],
	child_category_keys: [],
	culture_index_ranges: [],
	include_closed: false,
};

const applyPublicData = (
	data: {
		institutions: Institution[];
		categories: InstitutionStoreState["categories"];
		districts: string[];
	},
	set: (partial: Partial<InstitutionStoreState>) => void,
	get: () => InstitutionStoreState,
) => {
	const newState = {
		allInstitutions: data.institutions,
		categories: data.categories,
		districts: data.districts,
	};
	const currentState = { ...get(), ...newState };
	const filteredInstitutions = computeFilteredInstitutions(currentState);
	const allInstitutionsGeoJSON =
		data.institutions.length > 0
			? toFeatureCollection(data.institutions)
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
	const { categoryCounts, subcategoryCounts, cultureIndexRangeCounts } =
		computeCounts(stateWithFiltered);
	set({
		...newState,
		filteredInstitutions,
		allInstitutionsGeoJSON,
		filteredInstitutionsGeoJSON,
		categoryCounts,
		subcategoryCounts,
		cultureIndexRangeCounts,
		isLoading: false,
		error: null,
	});
};

const applyFilters = (
	filters: InstitutionStoreState["filters"],
	set: (partial: Partial<InstitutionStoreState>) => void,
	get: () => InstitutionStoreState,
) => {
	const newState = { filters };
	const currentState = { ...get(), ...newState };
	const filteredInstitutions = computeFilteredInstitutions(currentState);
	const { categoryCounts, subcategoryCounts, cultureIndexRangeCounts } =
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
		cultureIndexRangeCounts,
	});
};

const matchesBaseFilters = (
	institution: Institution,
	filters: InstitutionStoreState["filters"],
): boolean => {
	return (
		matchesStatusFilter(institution, filters.include_closed) &&
		matchesDistrictFilter(institution, filters.district_keys) &&
		matchesCultureIndexFilter(institution, filters.culture_index_ranges)
	);
};

const matchesCategoryFilters = (
	institution: Institution,
	filters: InstitutionStoreState["filters"],
): boolean => {
	const hasCategoryFilters =
		filters.category_keys.length > 0 || filters.child_category_keys.length > 0;

	if (!hasCategoryFilters) return true;

	return (
		matchesCategoryFilter(institution, filters.category_keys) ||
		matchesSubcategoryFilter(institution, filters.child_category_keys)
	);
};

const matchesFiltersExcludingCultureIndex = (
	institution: Institution,
	filters: InstitutionStoreState["filters"],
): boolean =>
	matchesStatusFilter(institution, filters.include_closed) &&
	matchesDistrictFilter(institution, filters.district_keys) &&
	matchesCategoryFilters(institution, filters);

const computeCounts = (state: InstitutionStoreState) => {
	const { allInstitutions, categories, filters } = state;

	const categoryCounts: Record<string, number> = {};
	const subcategoryCounts: Record<string, number> = {};
	const cultureIndexRangeCounts = createEmptyCultureIndexRangeCounts();

	if (!allInstitutions || !categories) {
		return { categoryCounts, subcategoryCounts, cultureIndexRangeCounts };
	}

	categories.forEach((category) => {
		categoryCounts[category.key] = 0;
		(category.child_categories || []).forEach((sub) => {
			subcategoryCounts[sub.key] = 0;
		});
	});

	allInstitutions.forEach((institution) => {
		if (matchesFiltersExcludingCultureIndex(institution, filters)) {
			const range = getCultureIndexRangeForValue(institution.culture_index);
			if (range) cultureIndexRangeCounts[range]++;
		}

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

	return { categoryCounts, subcategoryCounts, cultureIndexRangeCounts };
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
			cultureIndexRangeCounts: createEmptyCultureIndexRangeCounts(),
			districts: [],
			isLoading: false,
			error: null,
			filters: defaultFilters,
			setFilters: (filters) => applyFilters(filters, set, get),
			resetFilters: () => applyFilters(defaultFilters, set, get),
			categories: null,
			setCategories: (categories) => {
				if (areStoreSliceValuesEqual(get().categories, categories)) return;
				set({ categories });
			},
			setDistricts: (districts) => {
				if (areStoreSliceValuesEqual(get().districts, districts)) return;
				set({ districts });
			},
			clearError: () => set({ error: null }),
			hydratePublicData: (data) => applyPublicData(data, set, get),
			initializePublicData: async () => {
				set({ isLoading: true, error: null });
				try {
					const { institutions, categories, districts } =
						await getPublicInstitutionData();
					applyPublicData({ institutions, categories, districts }, set, get);
				} catch (error) {
					reportClientTelemetry({
						level: "error",
						event: "institution_store.public_init.failed",
						error,
					});
					set({
						isLoading: false,
						error:
							error instanceof Error
								? error.message
								: "Failed to initialize public institution data.",
					});
				}
			},
			setInstitutions: (institutions) => {
				if (areStoreSliceValuesEqual(get().allInstitutions, institutions)) {
					return;
				}
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
				const { categoryCounts, subcategoryCounts, cultureIndexRangeCounts } =
					computeCounts(stateWithFiltered);
				set({
					...newState,
					filteredInstitutions,
					allInstitutionsGeoJSON,
					filteredInstitutionsGeoJSON,
					categoryCounts,
					subcategoryCounts,
					cultureIndexRangeCounts,
				});
			},
		})),
	),
);
