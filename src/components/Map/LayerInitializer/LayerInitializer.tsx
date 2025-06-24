/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { LayerElement, LayerService, ManagedLayer } from "@/types"; // Passe den Pfad zu deinen Typen an
import GeoJSON from "ol/format/GeoJSON";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import { Layer } from "ol/layer";
import ImageLayer from "ol/layer/Image";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { bbox as bboxStrategy } from "ol/loadingstrategy";
import ImageWMS from "ol/source/ImageWMS";
import TileWMS from "ol/source/TileWMS";
import VectorSource from "ol/source/Vector";
import WMTS, { optionsFromCapabilities } from "ol/source/WMTS";
import { FC, useCallback, useEffect, useState } from "react";

const LayerInitializer: FC = () => {
	const config = useMapStore((state) => state.config);
	const map = useMapStore((state) => state.map);
	const setLayersInStore = useMapStore((state) => state.setLayers);

	const [wmtsCapabilities, setWmtsCapabilities] = useState<Record<string, any>>(
		{},
	);
	const [capabilitiesLoaded, setCapabilitiesLoaded] = useState(false);

	// Effekt zum dynamischen Laden aller benötigten WMTS Capabilities
	useEffect(() => {
		if (!config) return;

		const loadAllWmtsCapabilities = async () => {
			const allLayers = [
				...config.layerConfig.baselayer.elements,
				...config.layerConfig.subjectlayer.elements,
			];

			const wmtsServices = allLayers.filter(
				(l) => l.service?.typ === "WMTS" && l.service.capabilitiesUrl,
			);
			const uniqueCapabilitiesUrls = [
				...new Set(wmtsServices.map((l) => l.service.capabilitiesUrl!)),
			];

			if (uniqueCapabilitiesUrls.length === 0) {
				setCapabilitiesLoaded(true);
				return;
			}

			try {
				const capabilitiesPromises = uniqueCapabilitiesUrls.map(async (url) => {
					const response = await fetch(url);
					if (!response.ok) throw new Error(`Failed to fetch ${url}`);
					const text = await response.text();
					const parser = new WMTSCapabilities();
					return { url, capabilities: parser.read(text) };
				});

				const results = await Promise.all(capabilitiesPromises);

				const capabilitiesMap = results.reduce(
					(acc, { url, capabilities }) => {
						acc[url] = capabilities;
						return acc;
					},
					{} as Record<string, any>,
				);

				setWmtsCapabilities(capabilitiesMap);
			} catch (error) {
				console.error(
					"[LayerInitializer] Error loading WMTS capabilities:",
					error,
				);
			} finally {
				setCapabilitiesLoaded(true);
			}
		};

		loadAllWmtsCapabilities();
	}, [config]);

	// --- Layer Erstellungsfunktionen (mit useCallback für Stabilität) ---

	const createWMTSLayer = useCallback(
		(serviceConfig: LayerService): TileLayer<WMTS> | null => {
			const capabilities = wmtsCapabilities[serviceConfig.capabilitiesUrl!];
			if (!capabilities) {
				console.warn(
					`[LayerInitializer] WMTS capabilities for ${serviceConfig.capabilitiesUrl} not yet loaded.`,
				);
				return null;
			}
			try {
				const options = optionsFromCapabilities(capabilities, {
					layer: serviceConfig.layers!,
					matrixSet: serviceConfig.tileMatrixSet!,
				});
				if (!options) return null;
				const wmtsSource = new WMTS({
					...options,
					attributions: serviceConfig.layerAttribution,
				});
				return new TileLayer({ source: wmtsSource });
			} catch (error) {
				console.error(
					`[LayerInitializer] Error creating WMTS layer for service ${serviceConfig.id}:`,
					error,
				);
				return null;
			}
		},
		[wmtsCapabilities],
	);

	const createWMSLayer = useCallback(
		(
			serviceConfig: LayerService,
		): TileLayer<TileWMS> | ImageLayer<ImageWMS> => {
			const params = {
				LAYERS: serviceConfig.layers!,
				FORMAT: serviceConfig.format || "image/png",
				TRANSPARENT: serviceConfig.transparent ?? true,
				VERSION: serviceConfig.version || "1.3.0",
			};
			if (serviceConfig.singleTile) {
				const imageSource = new ImageWMS({
					url: serviceConfig.url,
					params,
					serverType: "geoserver",
					attributions: serviceConfig.layerAttribution,
				});
				return new ImageLayer({ source: imageSource });
			}
			const tileSource = new TileWMS({
				url: serviceConfig.url,
				params,
				serverType: "geoserver",
				attributions: serviceConfig.layerAttribution,
			});
			return new TileLayer({ source: tileSource });
		},
		[],
	);

	const createWFSLayer = useCallback(
		(serviceConfig: LayerService): VectorLayer<VectorSource> => {
			const vectorSource = new VectorSource({
				format: new GeoJSON(),
				url: (extent) =>
					`${serviceConfig.url}?service=WFS&version=1.1.0&request=GetFeature&typename=${serviceConfig.featureType}&outputFormat=application/json&srsname=${serviceConfig.crs}&bbox=${extent.join(",")},${serviceConfig.crs}`,
				strategy: bboxStrategy,
			});
			return new VectorLayer({ source: vectorSource });
		},
		[],
	);

	useEffect(() => {
		if (!config || !map || !capabilitiesLoaded) return;

		const allManagedLayers: ManagedLayer[] = [];

		const processLayerGroup = (
			layerElements: LayerElement[],
			layerType: "base" | "subject",
		) => {
			layerElements.forEach((layerConfig, index) => {
				const { service: serviceConfig } = layerConfig;
				if (!serviceConfig) {
					console.warn(
						`[LayerInitializer] Layer ${layerConfig.id} has no service config. Skipping.`,
					);
					return;
				}

				let olLayer: Layer | null = null;
				let status: ManagedLayer["status"] = "loaded";
				let error: string | undefined = undefined;

				try {
					switch (serviceConfig.typ) {
						case "WMTS":
							olLayer = createWMTSLayer(serviceConfig);
							break;
						case "WMS":
							olLayer = createWMSLayer(serviceConfig);
							break;
						case "WFS":
							olLayer = createWFSLayer(serviceConfig);
							break;
						default:
							throw new Error(`Unknown layer type: ${serviceConfig.typ}`);
					}
				} catch (e) {
					console.error(
						`[LayerInitializer] Failed to create layer ${layerConfig.id}:`,
						e,
					);
					status = "error";
					error = e instanceof Error ? e.message : String(e);
				}

				if (olLayer) {
					const zIndex = (layerType === "base" ? 0 : 100) + index;
					olLayer.setZIndex(zIndex);
					olLayer.setVisible(layerConfig.visibility);
					olLayer.setOpacity(1);

					const managedLayer: ManagedLayer = {
						id: layerConfig.id,
						config: layerConfig,
						olLayer: olLayer,
						status: status,
						visibility: layerConfig.visibility,
						opacity: 1,
						zIndex: zIndex,
						layerType: layerType,
						error: error,
					};

					allManagedLayers.push(managedLayer);
					map.addLayer(olLayer);
				}
			});
		};

		processLayerGroup(config.layerConfig.baselayer.elements, "base");
		processLayerGroup(config.layerConfig.subjectlayer.elements, "subject");
		setLayersInStore(allManagedLayers);

		// Cleanup-Funktion
		return () => {
			allManagedLayers.forEach((layer) => {
				map.removeLayer(layer.olLayer);
			});
			setLayersInStore([]);
		};
	}, [
		config,
		map,
		capabilitiesLoaded,
		createWMTSLayer,
		createWMSLayer,
		createWFSLayer,
		setLayersInStore,
	]);

	return null;
};

export default LayerInitializer;
