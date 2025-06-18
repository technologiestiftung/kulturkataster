"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { MapStoreState } from "@/types/map";
import VectorLayer from "ol/layer/Vector";
import { Vector as VectorSource } from "ol/source";
import { Fill, Stroke, Style } from "ol/style";
import { FC, useEffect } from "react";

interface OlVectorLayerProps {
	zIndex?: number;
}

const styles = {
	MultiPolygon: new Style({
		stroke: new Stroke({
			color: "blue",
			width: 1,
		}),
		fill: new Fill({
			color: "rgba(0, 0, 255, 0.5)",
		}),
	}),
};

const OlVectorLayer: FC<OlVectorLayerProps> = ({ zIndex = 200 }) => {
	const map = useMapStore((state: MapStoreState) => state.map);
	const config = useMapStore((state) => state.config);

	useEffect(() => {
		if (!map || !zIndex || !config) return;

		const vectorSource = new VectorSource({
			// features: new GeoJSON().readFeatures(
			// transformGeoJSON(config?.geojsonObject),
			// ),
		});

		const vectorLayer = new VectorLayer({
			source: vectorSource,
			style: styles.MultiPolygon,
		});

		map.addLayer(vectorLayer);
		vectorLayer.setZIndex(zIndex);

		return () => {
			if (map) {
				map.removeLayer(vectorLayer);
			}
		};
	}, [map, zIndex, config]);

	return null;
};

export default OlVectorLayer;
