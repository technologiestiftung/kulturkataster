import { VenueStoreState } from "@/types";
import { create } from "zustand";

export const useVenueStore = create<VenueStoreState>((set) => ({
	selectedVenueId: null,
	setSelectedVenueId: (id: string | null) => set({ selectedVenueId: id }),
}));
