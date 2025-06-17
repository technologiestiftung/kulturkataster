/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { MapStoreState } from "@/types/map";
import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";
import { FC, useEffect } from "react";

interface OlTileLayerProps {
	url: string;
	params: any;
	name?: string;
	zIndex?: number;
}

const OlTileLayer: FC<OlTileLayerProps> = ({
	url,
	params,
	zIndex = 100,
}) => {
	const map = useMapStore((state: MapStoreState) => state.map);

	useEffect(() => {
		if (!map || !zIndex) return;

		const source = new TileWMS({
			url,
			params,
		});

		const tileLayer = new TileLayer({
			source,
			zIndex,
		});

		map.addLayer(tileLayer);
		tileLayer.setZIndex(zIndex);

		return () => {
			map.removeLayer(tileLayer);
		};
	}, [map, url, params, zIndex]);

	return null;
};

export default OlTileLayer;
