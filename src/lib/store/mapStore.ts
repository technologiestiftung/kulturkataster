import {
	createGetLayerStatus,
	createSetLayerStatus,
} from "@/lib/store/mapActions";
import { MapStoreState } from "@/types/map";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useMapStore = create<MapStoreState>()(
	immer((set, get) => ({
		map: null,
		config: null,
		layers: [],
		currentFeature: null,
		userLocation: {
			coordinates: null,
			accuracy: undefined,
		},

		// Map
		setConfig: (config) => set({ config }),
		populateMap: (map) => set({ map }),
		removeMap: () => set({ map: null }),

		// Layers
		setLayers: (layers) =>
			set((state) => {
				state.layers = layers;
			}),
		addLayer: (layer) =>
			set((state) => {
				state.layers.push(layer);
			}),
		removeLayer: (layerId) =>
			set((state) => {
				state.layers = state.layers.filter((l) => l.id !== layerId);
			}),
		updateLayer: (layerId, updates) =>
			set((state) => {
				const layer = state.layers.find((l) => l.id === layerId);
				if (layer) {
					Object.assign(layer, updates);
				}
			}),

		setLayerVisibility: (layerId, visible) => {
			const layerToUpdate = get().layers.find((l) => l.id === layerId);

			if (layerToUpdate) {
				layerToUpdate.olLayer.setVisible(visible);
				get().updateLayer(layerId, { visibility: visible });
			}
		},
		setLayerOrder: (orderedIds) => {
			const currentLayers = get().layers;
			const sortedLayers = [...currentLayers].sort(
				(a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id),
			);

			set((state) => {
				state.layers = sortedLayers.map((layer, index) => {
					const newZIndex = 100 + index;
					layer.olLayer.setZIndex(newZIndex);
					return { ...layer, zIndex: newZIndex };
				});
			});
		},

		// Layer Status
		setLayerStatus: createSetLayerStatus(set, get),
		getLayerStatus: createGetLayerStatus(get),

		// Features
		setCurrentFeature: (currentFeature) =>
			set((state) => {
				state.currentFeature = currentFeature;
			}),

		// User Location
		setUserLocation: (userLocation) =>
			set((state) => {
				state.userLocation = userLocation;
			}),

		// LayerTree
		openLegendLayerId: "",
		setOpenLegendLayerId: (layerId: string) =>
			set((state) => {
				state.openLegendLayerId = layerId;
			}),
	})),
);
