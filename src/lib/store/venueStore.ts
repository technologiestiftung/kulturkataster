import { VenueStoreState } from "@/types";
import { create } from "zustand";

export const useVenueStore = create<VenueStoreState>((set) => ({
	venues: null,
	setVenues: (venues) => set({ venues }),

	filteredVenues: null,
	setFilteredVenues: (filteredVenues) => set({ filteredVenues }),

	selectedVenueId: null,
	setSelectedVenueId: (id: string | null) => set({ selectedVenueId: id }),

	filters: { districts: [], categories: [] },
	setFilters: (filters) => set({ filters }),
}));
