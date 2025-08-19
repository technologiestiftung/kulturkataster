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

// Helper function to check if institution matches category filter
const matchesCategoryFilter = (
	properties: InstitutionProperties,
	categoryKeys: string[],
): boolean => {
	if (categoryKeys.length === 0) return true;

	return (
		properties.categories?.some((category) =>
			categoryKeys.includes(category.key),
		) || false
	);
};

// Helper function to check if institution matches subcategory filter
const matchesSubcategoryFilter = (
	properties: InstitutionProperties,
	subcategoryKeys: string[],
): boolean => {
	if (subcategoryKeys.length === 0) return true;

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

// Helper function to check if institution matches status filter
const matchesStatusFilter = (
	properties: InstitutionProperties,
	includeClosed: boolean,
): boolean => {
	if (includeClosed) return true;
	return properties.status !== "closed";
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
			district_keys: [],
			category_keys: [],
			subcategory_keys: [],
			include_closed: true,
		},
		setFilters: (filters) => set({ filters }),

		initializeInstitutions: async () => {
			try {
				const institutionsData = await getInstitutionsGeoJSON();
				set({
					institutions: institutionsData,
					originalInstitutions: institutionsData,
				});
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

			// Load districts data to create ID to key mapping
			const districts = await getDistricts();
			const districtIdToKeyMap = new Map<number, string>();
			districts.forEach((district: District) => {
				districtIdToKeyMap.set(district.id, district.key);
			});

			const filteredFeatures = originalInstitutions.features.filter(
				(feature) => {
					const properties = feature.properties as InstitutionProperties;

					if (!properties) return false;

					return (
						matchesStatusFilter(properties, filters.include_closed) &&
						matchesDistrictFilter(
							properties,
							filters.district_keys,
							districtIdToKeyMap,
						) &&
						matchesCategoryFilter(properties, filters.category_keys) &&
						matchesSubcategoryFilter(properties, filters.subcategory_keys)
					);
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
