"use client";

import config from "@/config/config";
import mapConfig from "@/config/config.json";
import services from "@/config/resources/services.json";
import { useMapStore } from "@/lib/store/mapStore";
import { LayerElementBase } from "@/types";
import { FC, useEffect } from "react";

const MapInitializer: FC = ({}) => {
	const setConfig = useMapStore((state) => state.setConfig);
	const setAppConfig = useMapStore((state) => state.setAppConfig);

	useEffect(() => {
		setAppConfig(config);
	}, [setAppConfig]);

	useEffect(() => {
		const servicesMap = new Map(
			services.map((service) => [service.id, service]),
		);

		const enrichLayerElements = (elements: LayerElementBase[]) =>
			elements.map((layer) => ({
				...layer,
				status: "initial",
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
	}, [setConfig]);

	return null;
};

export default MapInitializer;
