import { filterInstitutions, getInstitutionsGeoJSON } from "@/lib/supabase/api";
import { InstitutionStoreState } from "@/types";
import { create } from "zustand";

export const useInstitutionStore = create<InstitutionStoreState>(
	(set, get) => ({
		institutions: null,
		setInstitutions: (institutions) => set({ institutions }),

		selectedInstitutionId: null,
		setSelectedInstitutionId: (id: string | null) =>
			set({ selectedInstitutionId: id }),

		filters: {
			status: undefined, // e.g., "open", "closed", etc.
			district_keys: [],
			category_keys: [],
			subcategory_keys: [],
			include_closed: true,
		},
		setFilters: (filters) => set({ filters }),

		initializeInstitutions: async () => {
			try {
				const institutionsData = await getInstitutionsGeoJSON();
				set({ institutions: institutionsData });
			} catch (error) {
				console.error("Failed to initialize institutions:", error);
			}
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
	}),
);
