import { createGetMapStatus, createSetMapStatus } from "@/lib/store/mapActions";
import { MapConfig, MapStoreState } from "@/types/map";
import Map from "ol/Map";
import { create } from "zustand";

export const useMapStore = create<MapStoreState>((set, get) => ({
	map: null,
	config: null,

	setConfig: (config: MapConfig) => {
		console.log("[mapStore] config::", config);
		set(() => ({ config }));
	},
	populateMap: (map: Map) => set(() => ({ map })),
	removeMap: () => set(() => ({ map: null })),

	// Injecting set/get into external functions
	setMapStatus: createSetMapStatus(set, get),
	getMapStatus: createGetMapStatus(get),
}));
