import {
	filterInstitutions,
	getDistricts,
	getInstitutionsGeoJSON,
} from "@/lib/supabase/api";
import {
	District,
	FilterState,
	InstitutionProperties,
	InstitutionStoreState,
} from "@/types";
import { FeatureCollection } from "geojson";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Helper function to check if institution matches district filter
const matchesDistrictFilter = (
	properties: InstitutionProperties,
	districtKeys: string[],
	districtIdToKeyMap: Map<number, string>,
): boolean => {
	if (districtKeys.length === 0) return true;

	if (!properties.district_id) return false;

	const districtKey = districtIdToKeyMap.get(properties.district_id);
	if (!districtKey) return false;

	return districtKeys.includes(districtKey);
};

const matchesCategoryFilter = (
	properties: InstitutionProperties,
	categoryKeys: string[],
): boolean => {
	return (
		properties.categories?.some((category) =>
			categoryKeys.includes(category.key),
		) || false
	);
};

const matchesSubcategoryFilter = (
	properties: InstitutionProperties,
	subcategoryKeys: string[],
): boolean => {
	const hasExplicitMatch = properties.subcategories?.some((subcategory) =>
		subcategoryKeys.includes(subcategory.key),
	);

	if (hasExplicitMatch) return true;

	if (
		(!properties.subcategories || properties.subcategories.length === 0) &&
		properties.categories?.length > 0
	) {
		const hasVirtualOthersMatch = properties.categories.some((category) => {
			const othersKey = `others_${category.key}`;
			return subcategoryKeys.includes(othersKey);
		});

		if (hasVirtualOthersMatch) return true;
	}

	return false;
};

const matchesStatusFilter = (
	properties: InstitutionProperties,
	includeClosedFilter: boolean,
): boolean => {
	if (
		!includeClosedFilter &&
		properties.utilization_status === "permanently_closed"
	) {
		return false;
	}
	return true;
};

export const useInstitutionStore = create<InstitutionStoreState>()(
	devtools((set, get) => ({
		institutions: null,
		originalInstitutions: null,
		setInstitutions: (institutions) => set({ institutions }),

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

			const districts = await getDistricts();
			const districtIdToKeyMap = new Map<number, string>();
			districts.forEach((district: District) => {
				districtIdToKeyMap.set(district.id, district.key);
			});

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
						districtIdToKeyMap,
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
