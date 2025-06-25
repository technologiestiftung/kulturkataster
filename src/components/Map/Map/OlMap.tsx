"use client";

import appConfig from "@/config/config";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import { transform } from "ol/proj";
import { register } from "ol/proj/proj4";
import { OSM } from "ol/source";
import proj4 from "proj4";
import React, { FC, useEffect, useRef } from "react";
import "../../../../node_modules/ol/ol.css";
import { useMapStore } from "../../../lib/store/mapStore";

if (appConfig) {
	appConfig.namedProjections.forEach((projection) => {
		proj4.defs(projection[1]);
	});
	register(proj4);
}

interface OlMapProps {
	children?: React.ReactNode;
}

const OlMap: FC<OlMapProps> = ({ children }) => {
	const setMap = useMapStore((state) => state.populateMap);
	const destroyMap = useMapStore((state) => state.removeMap);
	const config = useMapStore((state) => state.config);
	const mapId = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!config) return;

		const mapViewConfig = config.portalConfig.map.mapView;

		const projection = mapViewConfig.epsg;
		let center = mapViewConfig.startCenter;

		if (
			center.length === 2 &&
			Math.abs(center[0]) <= 180 &&
			Math.abs(center[1]) <= 90
		) {
			console.log("[OlMap] Converting center from LonLat to", projection);
			center = transform(center, "EPSG:4326", projection);
		} else if (projection !== "EPSG:25833") {
			console.log("[OlMap] Transforming center to", projection);
		}

		const resolutions = mapViewConfig.options
			.sort((a, b) => a.zoomLevel - b.zoomLevel)
			.map((option) => option.resolution);

		const startZoomLevel = Math.max(
			0,
			Math.min(mapViewConfig.startZoomLevel, resolutions.length - 1),
		);
		if (startZoomLevel !== mapViewConfig.startZoomLevel) {
			console.warn(
				`[OlMap] Start zoom level ${mapViewConfig.startZoomLevel} is out of range. Using ${startZoomLevel} instead.`,
			);
		}

		if (!mapId.current) {
			console.error("[OlMap] mapId.current is not defined");
			return;
		}

		try {
			const map = new Map({
				target: mapId.current,
				layers: [
					new TileLayer({
						source: new OSM(),
					}),
				],
				view: new View({
					center: center,
					zoom: startZoomLevel,
					projection: projection,
					extent: mapViewConfig.extent,
					resolutions: resolutions,
					minZoom: 0,
					maxZoom: resolutions.length - 1,
				}),
			});

			// Log the actual view configuration for debugging
			console.log("[OlMap] View configuration:", {
				center: center,
				zoom: startZoomLevel,
				projection: projection,
				extent: mapViewConfig.extent,
				resolutions: resolutions,
				minZoom: 0,
				maxZoom: resolutions.length - 1,
			});

			setMap(map);

			return () => {
				if (map) {
					map.setTarget(undefined);
				}
				destroyMap();
			};
		} catch (error) {
			console.error("[OlMap] Error initializing map:", error);
		}
	}, [config, destroyMap, setMap]);

	return (
		<div ref={mapId} className="w-screen h-screen bg-slate-300">
			{children}
		</div>
	);
};

export default OlMap;
