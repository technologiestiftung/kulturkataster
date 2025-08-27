import { filterInstitutions, getInstitutionsGeoJSON } from "@/lib/supabase/api";
import {
	FilterState,
	InstitutionProperties,
	InstitutionStoreState,
} from "@/types";
import { FeatureCollection } from "geojson";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
	matchesCategoryFilter,
	matchesDistrictFilter,
	matchesStatusFilter,
	matchesSubcategoryFilter,
} from "../utils/filterUtils";

export const useInstitutionStore = create<InstitutionStoreState>()(
	devtools((set, get) => ({
		institutions: null,
		originalInstitutions: null,
		setInstitutions: (institutions) => set({ institutions }),

		selectedInstitutionId: null,
		setSelectedInstitutionId: (id: string | null) =>
			set({ selectedInstitutionId: id }),

		filters: {
			district_keys: [],
			category_keys: [],
			subcategory_keys: [],
			include_closed: false,
		},
		setFilters: (filters) => set({ filters }),

		initializeInstitutions: async () => {
			try {
				const institutionsData = await getInstitutionsGeoJSON();
				set({
					institutions: institutionsData,
					originalInstitutions: institutionsData,
				});

				const { filters, filterInstitutionsFrontend } = get();
				await filterInstitutionsFrontend(filters);
			} catch (error) {
				console.error("Failed to initialize institutions:", error);
			}
		},

		filterInstitutionsFrontend: async (filters: FilterState) => {
			const { originalInstitutions } = get();

			if (!originalInstitutions?.features) {
				console.warn("No original institutions data to filter");
				return;
			}

			const filteredFeatures = originalInstitutions.features.filter(
				(feature) => {
					const properties = feature.properties as InstitutionProperties;

					if (!properties) return false;

					const statusMatch = matchesStatusFilter(
						properties,
						filters.include_closed,
					);
					const districtMatch = matchesDistrictFilter(
						properties,
						filters.district_keys,
					);

					const hasCategoryFilters =
						filters.category_keys.length > 0 ||
						filters.subcategory_keys.length > 0;

					let categoryMatch = true;

					if (hasCategoryFilters) {
						categoryMatch =
							matchesCategoryFilter(properties, filters.category_keys) ||
							matchesSubcategoryFilter(properties, filters.subcategory_keys);
					}

					return statusMatch && districtMatch && categoryMatch;
				},
			);

			const filteredGeoJSON: FeatureCollection = {
				type: "FeatureCollection",
				features: filteredFeatures,
			};

			set({ institutions: filteredGeoJSON });
		},

		applyFilters: async () => {
			const { filters } = get();
			try {
				let filteredData;

				if (filters) {
					filteredData = await filterInstitutions(filters);
				} else {
					filteredData = await getInstitutionsGeoJSON();
				}

				set({ institutions: filteredData });
			} catch (error) {
				console.error("Failed to apply filters:", error);
			}
		},
	})),
);
