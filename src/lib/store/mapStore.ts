import Map from "ol/Map";
import { create } from "zustand";
import mapConfig from "../../config/map-config.json";
import { MapConfig, MapStoreState } from "../../types/map";

export const useMapStore = create<MapStoreState>((set) => ({
	map: null,
	config: mapConfig,
	setConfig: (config: MapConfig) => set({ config }),
	populateMap: (map: Map) => set({ map }),
	removeMap: () => set({ map: null }),
}));
