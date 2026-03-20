"use client";

import appConfig from "@/config/config";
import Map from "ol/Map";
import View from "ol/View";
import { transform } from "ol/proj";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import React, { FC, useEffect, useRef } from "react";
import "../../../../node_modules/ol/ol.css";
import { useMapStore } from "../../../lib/store/mapStore";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";

if (appConfig?.namedProjections?.length) {
	appConfig.namedProjections.forEach(([name, def]) => {
		proj4.defs(name, def);
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	register(proj4 as unknown as any);
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
			center = transform(center, "EPSG:4326", projection);
		} else if (projection !== "EPSG:25833") {
		}

		const resolutions = [...mapViewConfig.options]
			.sort((a, b) => a.zoomLevel - b.zoomLevel)
			.map((option) => option.resolution);

		const startZoomLevel = Math.max(
			0,
			Math.min(mapViewConfig.startZoomLevel, resolutions.length - 1),
		);
		if (startZoomLevel !== mapViewConfig.startZoomLevel) {
			reportClientTelemetry({
				level: "warn",
				event: "map.ol_map.start_zoom.out_of_range",
				metadata: {
					requested_zoom_level: mapViewConfig.startZoomLevel,
					applied_zoom_level: startZoomLevel,
				},
			});
		}

		if (!mapId.current) {
			reportClientTelemetry({
				level: "error",
				event: "map.ol_map.target.missing",
			});
			return;
		}

		try {
			const map = new Map({
				target: mapId.current,
				view: new View({
					center: center,
					zoom: startZoomLevel,
					projection: projection,
					smoothResolutionConstraint: false,
					constrainResolution: true,
					extent: mapViewConfig.extent,
					resolutions: resolutions,
					minZoom: 0,
					maxZoom: resolutions.length - 1,
				}),
			});

			setMap(map);

			return () => {
				if (map) {
					map.setTarget(undefined);
				}
				destroyMap();
			};
		} catch (error) {
			reportClientTelemetry({
				level: "error",
				event: "map.ol_map.init.failed",
				error,
			});
		}
	}, [config, destroyMap, setMap]);

	return (
		<div
			ref={mapId}
			className="map contrast:invert-90 w-full h-full bg-slate-300"
		>
			{children}
		</div>
	);
};

export default OlMap;
