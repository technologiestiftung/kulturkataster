"use client";

import { useMapStore } from "@/lib/store/mapStore";
import Feature from "ol/Feature";
import Geolocation from "ol/Geolocation";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { FC, useEffect, useRef, useState } from "react";

const GeolocationControl: FC = () => {
	const map = useMapStore((state) => state.map);
	const view = map?.getView();

	const [isTracking, setIsTracking] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isCenteredRef = useRef(false);
	const geolocationRef = useRef<Geolocation | null>(null);
	const layerRef = useRef<VectorLayer<VectorSource> | null>(null);
	const positionFeatureRef = useRef<Feature | null>(null);

	useEffect(() => {
		if (!view || !map) return;

		const source = new VectorSource();
		const layer = new VectorLayer({
			source: source,
			// TODO: add state to track highest zIndex of all layers
			zIndex: 100000,
		});

		const positionFeature = new Feature();
		positionFeature.setStyle(
			new Style({
				image: new CircleStyle({
					radius: 8,
					fill: new Fill({
						color: "#3399CC",
					}),
					stroke: new Stroke({
						color: "#fff",
						width: 3,
					}),
				}),
			}),
		);

		source.addFeature(positionFeature);
		layerRef.current = layer;
		positionFeatureRef.current = positionFeature;

		const geolocation = new Geolocation({
			trackingOptions: {
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 60000,
			},
			tracking: false,
			projection: view.getProjection(),
		});

		geolocationRef.current = geolocation;

		geolocation.on("change:position", () => {
			const coordinates = geolocation.getPosition();
			console.log("[GeolocationControl] New coordinates:", coordinates);

			if (coordinates && positionFeatureRef.current) {
				positionFeatureRef.current.setGeometry(new Point(coordinates));
				// TODO: check if coordinates are withing the map bounds if not, show error

				if (!isCenteredRef.current) {
					view.setCenter(coordinates);
					view.setZoom(16);
					isCenteredRef.current = true;
				}
			} else if (positionFeatureRef.current) {
				positionFeatureRef.current.setGeometry(undefined);
			}
		});

		geolocation.on("error", (_error) => {
			console.error("[GeolocationControl] Geolocation error:", _error.message);
			setError(_error.message);
			setIsLoading(false);
			setIsTracking(false);
		});

		return () => {
			if (geolocationRef.current) {
				geolocationRef.current.setTracking(false);
			}
			if (layerRef.current) {
				map.removeLayer(layerRef.current);
			}
		};
	}, [view, map]);

	const handleGeolocate = async () => {
		if (!geolocationRef.current || !map || !layerRef.current) return;

		if (isTracking) {
			geolocationRef.current.setTracking(false);
			setIsTracking(false);
			setIsLoading(false);
			setError(null);
			isCenteredRef.current = false;

			map.removeLayer(layerRef.current);
		} else {
			setIsLoading(true);
			setError(null);

			map.addLayer(layerRef.current);

			try {
				if (!navigator.geolocation) {
					throw new Error("Geolocation is not supported by this browser");
				}

				geolocationRef.current.setTracking(true);
				setIsTracking(true);
				setIsLoading(false);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to get location";
				setError(errorMessage);
				setIsLoading(false);
				setIsTracking(false);
			}
		}
	};

	const buttonText = isTracking ? "Stop Tracking" : "Geolocate Me!";
	const buttonClass = isTracking
		? "bg-red-500 hover:bg-red-600"
		: "bg-blue-500 hover:bg-blue-600";

	return (
		<div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
			<button
				onClick={handleGeolocate}
				disabled={isLoading}
				className={`px-4 py-2 text-white font-medium rounded-lg shadow-lg transition-colors duration-200 ${buttonClass} ${
					isLoading ? "opacity-50 cursor-not-allowed" : ""
				}`}
			>
				{isLoading ? "Locating..." : buttonText}
			</button>

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm max-w-xs">
					{error}
				</div>
			)}
		</div>
	);
};

export default GeolocationControl;
