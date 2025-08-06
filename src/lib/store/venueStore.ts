import { filterInstitutions, getInstitutionsGeoJSON } from "@/lib/supabase/api";
import { VenueStoreState } from "@/types";
import { create } from "zustand";

export const useVenueStore = create<VenueStoreState>((set, get) => ({
	venues: null,
	setVenues: (venues) => set({ venues }),

	selectedVenueId: null,
	setSelectedVenueId: (id: string | null) => set({ selectedVenueId: id }),

	filters: { districts: [], categories: [], subcategories: [] },
	setFilters: (filters) => set({ filters }),

	initializeVenues: async () => {
		try {
			const venuesData = await getInstitutionsGeoJSON();
			console.log("[venueStore] venuesData::", venuesData);
			set({ venues: venuesData });
		} catch (error) {
			console.error("Failed to initialize venues:", error);
		}
	},

	applyFilters: async () => {
		const { filters } = get();
		if (!filters) {
			console.warn("No filters available");
			return;
		}
		try {
			const filteredData = await filterInstitutions(filters);
			set({ venues: filteredData });
		} catch (error) {
			console.error("Failed to apply filters:", error);
		}
	},
}));
