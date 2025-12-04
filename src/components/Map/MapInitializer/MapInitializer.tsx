"use client";

import mapConfig from "@/config/config.json";
import services from "@/config/resources/services.json";
import { useMapStore } from "@/lib/store/mapStore";
import {
	LayerElement,
	LayerElementBase,
	LayerStatus,
	MapConfig,
} from "@/types";
import { FC, useEffect } from "react";
import MapComp from "../Map";
import { useAppStore } from "@/lib/store/appStore";
import { useTranslation } from "react-i18next";

const MapInitializer: FC = ({}) => {
	const setConfig = useMapStore((state) => state.setConfig);
	const { viewMode } = useAppStore();
	const { t } = useTranslation("common");

	useEffect(() => {
		const servicesMap = new Map(
			services.map((service) => [service.id, service]),
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
	}, [setConfig]);

	return (
		<>
			{viewMode === "map" && (
				<div className="items-center flex-1 justify-items-center h-full relative w-full">
					<section className="h-full w-full" aria-label={t("map.title")}>
						<MapComp />
					</section>
				</div>
			)}
		</>
	);
};

export default MapInitializer;
