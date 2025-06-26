"use client";

import venues from "@/config/resources/venues.json";
import { useMapStore } from "@/lib/store/mapStore";
import { transformGeoJSON } from "@/lib/utils/mapUtils";
import { MapStoreState } from "@/types/map";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import { Vector as VectorSource } from "ol/source";
import { Fill, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { FC, useEffect } from "react";

interface VectorBasemapProps {
	zIndex?: number;
}

const image = new CircleStyle({
	radius: 5,
	fill: new Fill({
		color: "rgba(255, 255, 0, 1)",
	}),
	stroke: new Stroke({ color: "red", width: 3 }),
});

const styles = {
	Point: new Style({
		image: image,
	}),
	MultiPoint: new Style({
		image: image,
	}),
};
const VectorBasemap: FC<VectorBasemapProps> = ({ zIndex = 10000 }) => {
	const map = useMapStore((state: MapStoreState) => state.map);
	const config = useMapStore((state) => state.config);

	const styleFunction = function (feature) {
		return styles[feature.getGeometry().getType()];
	};

	useEffect(() => {
		if (!map || !zIndex || !config) return;

		// todo: check highest z-Index and add venues on top

		const vectorSource = new VectorSource({
			features: new GeoJSON().readFeatures(transformGeoJSON(venues)),
		});

		const vectorLayer = new VectorLayer({
			source: vectorSource,
			style: styleFunction,
		});

		map.addLayer(vectorLayer);
		vectorLayer.setZIndex(zIndex);
		vectorLayer.set("name", "venues");
		vectorLayer.set("id", "venues");

		return () => {
			if (map) {
				map.removeLayer(vectorLayer);
			}
		};
	}, [map, zIndex, config]);

	return null;
};

export default VectorBasemap;
