import { create } from "zustand";
import { MapState } from "./types";

export const useMapStore = create<MapState>((set) => ({
	map: null,
	setMap: (map) => set({ map }),
	mapStyle: null,
	setMapStyle: (style) => set({ mapStyle: style }),
	venueProperties: null,
	setVenueProperties: (properties) => set({ venueProperties: properties }),
}));
