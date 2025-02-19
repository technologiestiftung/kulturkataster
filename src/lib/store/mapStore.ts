import { create } from "zustand";
import { MapState } from "./types";

export const useMapStore = create<MapState>((set) => ({
	mapStyle: null,
	setMapStyle: (style) => set({ mapStyle: style }),
}));
