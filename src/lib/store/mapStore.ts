// import mapConfig from "@/config/map-config.json";
import { MapConfig, MapStoreState } from "@/types/map";
import Map from "ol/Map";
import { create } from "zustand";

export const useMapStore = create<MapStoreState>((set) => ({
	map: null,
	config: null,
	setConfig: (config: MapConfig) => set({ config }),
	populateMap: (map: Map) => set({ map }),
	removeMap: () => set({ map: null }),
}));
