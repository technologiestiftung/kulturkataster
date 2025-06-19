/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { LayerElement, LayerService } from "@/types";
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

	const [wmtsCapabilities, setWmtsCapabilities] = useState<Record<string, any>>(
		{},
	);
	const [capabilitiesLoaded, setCapabilitiesLoaded] = useState(false);

	useEffect(() => {
		if (!config) return;

		const loadAllWmtsCapabilities = async () => {
			const allLayers = [
				...config.layerConfig.baselayer.elements,
				...config.layerConfig.subjectlayer.elements,
			];

			const wmtsServices = allLayers.filter(
				(l) => l.service.typ === "WMTS" && l.service.capabilitiesUrl,
			);
			const uniqueCapabilitiesUrls = [
				...new Set(wmtsServices.map((l) => l.service.capabilitiesUrl!)),
			];

			if (uniqueCapabilitiesUrls.length === 0) {
				setCapabilitiesLoaded(true);
				return;
			}

			console.log(
				"[LayerInitializer] Fetching WMTS capabilities from:",
				uniqueCapabilitiesUrls,
			);

			try {
				const capabilitiesPromises = uniqueCapabilitiesUrls.map(async (url) => {
					const response = await fetch(url);
					if (!response.ok) throw new Error(`Failed to fetch ${url}`);
					const text = await response.text();
					const parser = new WMTSCapabilities();
					const capabilities = parser.read(text);
					return { url, capabilities };
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
				console.log(
					"[LayerInitializer] All WMTS Capabilities loaded:",
					capabilitiesMap,
				);
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

	const createWMTSLayer = useCallback(
		(
			serviceConfig: LayerService,
			layerConfig: LayerElement,
		): TileLayer<WMTS> | null => {
			const capabilities = wmtsCapabilities[serviceConfig.capabilitiesUrl!];
			if (!capabilities) {
				console.warn(
					`[LayerInitializer] WMTS capabilities for ${serviceConfig.capabilitiesUrl} not ready for layer ${layerConfig.id}.`,
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
					`[LayerInitializer] Error creating WMTS layer ${layerConfig.id}:`,
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

		console.log("[LayerInitializer] Starting to create layers...");
		const allCreatedLayers: Layer[] = [];

		const processLayerGroup = (
			layerElements: LayerElement[],
			layerType: "base" | "subject",
		) => {
			layerElements.forEach((layerConfig) => {
				const { service: serviceConfig } = layerConfig; // serviceConfig extrahieren
				if (!serviceConfig) {
					console.warn(
						`[LayerInitializer] Layer ${layerConfig.id} has no service configuration. Skipping.`,
					);
					return;
				}

				let layer: Layer | null = null;
				try {
					switch (serviceConfig.typ) {
						case "WMTS":
							layer = createWMTSLayer(serviceConfig, layerConfig);
							break;
						case "WMS":
							layer = createWMSLayer(serviceConfig);
							break;
						case "WFS":
							layer = createWFSLayer(serviceConfig);
							break;
						default:
							console.error(
								`[LayerInitializer] Unsupported layer type: ${serviceConfig.typ} for layer ${layerConfig.id}`,
							);
							// TODO: Handle unsupported layer types -> status layer error
							break;
					}

					if (layer) {
						layer.set("id", layerConfig.id);
						layer.set("name", serviceConfig.name);
						layer.set("type", serviceConfig.typ.toLowerCase());
						layer.set("layerType", layerType);
						layer.setVisible(layerConfig.visibility);
						layer.setOpacity(1); // Standard-Opacity, kann später angepasst werden
						allCreatedLayers.push(layer);
					}
				} catch (error) {
					console.error(
						`[LayerInitializer] Failed to create layer ${layerConfig.id}:`,
						error,
					);
				}
			});
		};

		processLayerGroup(config.layerConfig.baselayer.elements, "base");
		processLayerGroup(config.layerConfig.subjectlayer.elements, "subject");

		if (allCreatedLayers.length > 0) {
			allCreatedLayers.forEach((layer) => map.addLayer(layer));
			console.log(
				`[LayerInitializer] Added ${allCreatedLayers.length} layers to the map.`,
			);
		}

		return () => {
			console.log(
				`[LayerInitializer] Cleaning up ${allCreatedLayers.length} layers.`,
			);
			allCreatedLayers.forEach((layer) => {
				map.removeLayer(layer);
			});
		};
		// NEU: Das Abhängigkeitsarray enthält jetzt die stabilen useCallback-Funktionen
	}, [
		config,
		map,
		capabilitiesLoaded,
		createWMTSLayer,
		createWMSLayer,
		createWFSLayer,
	]);

	return null;
};

export default LayerInitializer;
