import { VenueState } from "@/types";
import { create } from "zustand";

export const useVenueStore = create<VenueState>((set) => ({
	selectedVenueId: "",
	setSelectedVenueId: (id: string) => set({ selectedVenueId: id }),
	selectedVenueProperties: null,
	setSelectedVenueProperties: (properties) =>
		set({ selectedVenueProperties: properties }),
}));
