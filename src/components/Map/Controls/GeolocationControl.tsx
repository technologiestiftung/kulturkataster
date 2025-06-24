"use client";
import { useMapStore } from "@/lib/store/mapStore";
import Feature from "ol/Feature";
import Geolocation from "ol/Geolocation";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style"; // Besserer Import
import { FC, useEffect, useRef } from "react";

const GeolocationControl: FC = ({}) => {
	const map = useMapStore((state) => state.map);
	const view = map?.getView();

	const isCenteredRef = useRef(false);

	useEffect(() => {
		if (!view || !map) return;

		const source = new VectorSource();
		const layer = new VectorLayer({
			source: source,
			zIndex: 100000,
		});
		map.addLayer(layer);

		const positionFeature = new Feature();
		positionFeature.setStyle(
			new Style({
				image: new CircleStyle({
					radius: 6,
					fill: new Fill({
						color: "#3399CC",
					}),
					stroke: new Stroke({
						color: "#fff",
						width: 2,
					}),
				}),
			}),
		);
		source.addFeature(positionFeature);

		const geolocation = new Geolocation({
			trackingOptions: {
				enableHighAccuracy: true,
			},
			tracking: true,
			projection: view.getProjection(),
		});

		geolocation.on("change:position", () => {
			const coordinates = geolocation.getPosition();
			console.log("[GeolocationControl] New coordinates::", coordinates);

			if (coordinates) {
				positionFeature.setGeometry(new Point(coordinates));

				if (!isCenteredRef.current) {
					view.setCenter(coordinates);
					view.setZoom(5);
					isCenteredRef.current = true;
				}
			} else {
				positionFeature.setGeometry(undefined);
			}
		});

		geolocation.on("error", (error) => {
			console.error("[GeolocationControl] Geolocation error:", error.message);
		});

		return () => {
			geolocation.setTracking(false);
			map.removeLayer(layer);
		};
	}, [view, map]);

	return null;
};

export default GeolocationControl;
