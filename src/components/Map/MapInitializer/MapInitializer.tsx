"use client";
import mapConfig from "@/config/map-config.json";
import services from "@/config/resources/services.json";
import { useMapStore } from "@/lib/store/mapStore";
import { LayerElement } from "@/types";
import { FC, useEffect } from "react";

const MapInitializer: FC = ({}) => {
	const setConfig = useMapStore((state) => state.setConfig);

  useEffect(() => {
		const servicesMap = new Map(
			services.map((service) => [service.id, service]),
		);

		const enrichLayerElements = (elements: LayerElement[]) =>
			elements.map((layer) => ({
				...layer,
				service: servicesMap.get(layer.id) || null,
			}));

		const enrichedConfig = structuredClone(mapConfig);

		enrichedConfig.layerConfig.baselayer.elements = enrichLayerElements(
			enrichedConfig.layerConfig.baselayer.elements,
		);

		enrichedConfig.layerConfig.subjectlayer.elements = enrichLayerElements(
			enrichedConfig.layerConfig.subjectlayer.elements,
		);

		setConfig(enrichedConfig);
	}, []);

	return null;
};

export default MapInitializer;
