"use client";

import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import { transform } from "ol/proj";
import { register } from "ol/proj/proj4";
import { OSM } from "ol/source";
import React, { FC, useEffect, useRef } from "react";
import "../../../../node_modules/ol/ol.css";
import { useMapStore } from "../../../lib/store/mapStore";
import proj4 from "proj4";

proj4.defs(
	"EPSG:25833",
	"+title=ETRS89/UTM 33N +proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);

register(proj4);

interface OlMapProps {
	children?: React.ReactNode;
}

const OlMap: FC<OlMapProps> = ({ children }) => {
	const setMap = useMapStore((state) => state.populateMap);
	const destroyMap = useMapStore((state) => state.removeMap);
	const config = useMapStore((state) => state.config);
	const mapId = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!config) {
			console.error("[OlMap] config is not defined");
			return;
		}

		console.log("[OlMap] config::", config);

		// Überprüfen, ob die Projektion in der Konfiguration angegeben ist
		const projection = config.portalConfig.map.mapView.epsg || "EPSG:25833";

		// Überprüfen, ob die Koordinaten im EPSG:4326-Format (Längengrad/Breitengrad) vorliegen
		let center = config.portalConfig.map.mapView.startCenter;

		// const center = fromLonLat(config.portalConfig.map.mapView.startCenter);

		if (
			center.length === 2 &&
			Math.abs(center[0]) <= 180 &&
			Math.abs(center[1]) <= 90
		) {
			console.log("[OlMap] Converting center from LonLat to", projection);
			center = transform(center, "EPSG:4326", projection); // Konvertieren zur Zielprojektion
		} else if (projection !== "EPSG:25833") {
			console.log("[OlMap] Transforming center to", projection);
			center = transform(center, projection, "EPSG:25833"); // Konvertieren von einer anderen Projektion zur Zielprojektion
		}

		// Überprüfen, ob mapId.current vorhanden ist
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
					zoom: config.portalConfig.map.mapView.startZoomLevel,
					projection: projection,
					extent: config.portalConfig.map.mapView.extent,
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
			console.error("[OlMap] Error initializing map:", error);
		}
	}, [config]);

	return (
		<div ref={mapId} className="w-screen h-screen bg-slate-300">
			{children}
		</div>
	);
};

export default OlMap;
