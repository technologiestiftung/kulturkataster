import {
	createGetLayerStatus,
	createSetLayerStatus,
} from "@/lib/store/mapActions";
import { MapStoreState } from "@/types/map";
import { create } from "zustand";

export const useMapStore = create<MapStoreState>((set, get) => ({
	map: null,
	config: null,
	layers: {},

	// Map
	setConfig: (config) => set({ config }),
	populateMap: (map) => set({ map }),
	removeMap: () => set({ map: null }),

	// Layers
	setLayers: (layers) => set({ layers }),
	addLayer: (id, layer) =>
		set((state) => ({ layers: { ...state.layers, [id]: layer } })),
	removeLayer: (id) =>
		set((state) => {
			const { [id]: _, ...rest } = state.layers;
			return { layers: rest };
		}),

	// Layer Status
	setLayerStatus: createSetLayerStatus(set, get),
	getLayerStatus: createGetLayerStatus(get),
}));
