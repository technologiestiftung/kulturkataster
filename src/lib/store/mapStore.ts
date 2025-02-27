import { MapState } from "@/types";
import { create } from "zustand";

export const useMapStore = create<MapState>((set) => ({
	map: null,
	setMap: (map) => set({ map }),
	mapStyle: null,
	setMapStyle: (style) => set({ mapStyle: style }),
	venueProperties: null,
	setVenueProperties: (properties) => set({ venueProperties: properties }),
	currentVenue: null,
	setCurrentVenue: (venue) => set({ currentVenue: venue }),
}));
