"use client";
import { useMapStore } from "@/lib/store/mapStore";
import Feature from "ol/Feature";
import Geolocation from "ol/Geolocation";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { FC, useEffect } from "react";

const GeolocationControl: FC = ({}) => {
	const map = useMapStore((state) => state.map);
	const view = map?.getView();

	useEffect(() => {
		if (!view || !map) return;
		console.log("[GeolocationControl] view::", view);
		const source = new VectorSource();
		const layer = new VectorLayer({
			source: source,
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

		// listen to changes in position
		geolocation.on("change", () => {
			const coordinates = geolocation.getPosition();
			console.log("[GeolocationControl] coordinates::", coordinates);
			if (coordinates) {
				positionFeature.setGeometry(new Point(coordinates));
			} else {
				positionFeature.setGeometry(undefined);
			}
			view.setCenter(geolocation.getPosition());
		});

		return () => {
			map.removeLayer(layer);
			geolocation.setTracking(false);
		};
	}, [view, map]);

	return <div className="GeolocationControl-root"></div>;
};

export default GeolocationControl;
