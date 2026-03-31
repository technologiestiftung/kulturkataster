"use client";

import mapConfig from "@/config/config.json";
import services from "@/config/resources/services.json";
import servicesEn from "@/config/resources/services.en.json";
import { useMapStore } from "@/lib/store/mapStore";
import {
	LayerElement,
	LayerElementBase,
	LayerStatus,
	MapConfig,
} from "@/types";
import { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import MapView from "../Map";

const MapInitializer: FC = ({}) => {
	const { i18n } = useTranslation("common");
	const setConfig = useMapStore((state) => state.setConfig);
	const isGerman = i18n.resolvedLanguage?.startsWith("de");
	const localizedServices = isGerman ? services : servicesEn;

	useEffect(() => {
		const servicesMap = new Map(
			localizedServices.map((service) => [service.id, service]),
		);

		const enrichLayerElements = (elements: LayerElementBase[]) =>
			(elements as LayerElement[]).map((layer) => ({
				...layer,
				status: "initial" as LayerStatus,
				service: servicesMap.get(layer.id),
			}));

		const enrichedConfig = structuredClone(mapConfig);

		enrichedConfig.layerConfig.baselayer.elements = enrichLayerElements(
			enrichedConfig.layerConfig.baselayer.elements,
		);

		enrichedConfig.layerConfig.subjectlayer.elements = enrichLayerElements(
			enrichedConfig.layerConfig.subjectlayer.elements,
		);

		setConfig(enrichedConfig as unknown as MapConfig);
	}, [localizedServices, setConfig]);

	return (
		<div className="items-center flex-1 justify-items-center h-full relative w-full">
			<MapView />
		</div>
	);
};

export default MapInitializer;
