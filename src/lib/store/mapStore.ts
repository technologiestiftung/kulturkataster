import { MapState } from "@/types";
import { create } from "zustand";

export const useMapStore = create<MapState>((set) => ({
	map: null,
	setMap: (map) => set({ map }),
	mapStyle: null,
	setMapStyle: (style) => set({ mapStyle: style }),
}));
