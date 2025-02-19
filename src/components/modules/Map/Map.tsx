"use client";

import maplibregl, { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FC, useEffect, useRef, useState } from "react";
import GeolocationSearch from "@/components/elements/GeolocationSearch/GeolocationSearch";

interface MapProps {
	mapStyle: StyleSpecification;
	onMapClick?: (e: maplibregl.MapMouseEvent) => void;
}

const Map: FC<MapProps> = ({ onMapClick, mapStyle }) => {
	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<maplibregl.Map | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!mapContainer.current) {
			return;
		}

		map.current = new maplibregl.Map({
			container: mapContainer.current,
			style: mapStyle,
			attributionControl: false,
		});

		// Add scale control
		map.current.addControl(new maplibregl.ScaleControl(), "bottom-right");

		// Add navigation controls
		map.current.addControl(new maplibregl.NavigationControl(), "bottom-left");

		map.current.addControl(
			new maplibregl.GeolocateControl({
				positionOptions: {
					enableHighAccuracy: true,
				},
				trackUserLocation: true,
			}),
		);

		// Setup map event handlers
		map.current.on("load", () => {
			setLoading(false);
		});

		if (onMapClick) {
			map.current.on("click", onMapClick);
		}

		// Cleanup function
		return () => {
			if (map.current) {
				if (onMapClick) {
					map.current.off("click", onMapClick);
				}
				map.current.remove();
			}
		};
	}, [onMapClick, mapStyle]);

	return (
		<div className="relative w-screen h-[600px]">
			<GeolocationSearch map={map.current} />
			<div ref={mapContainer} className="w-full h-full" />
			{loading && (
				<div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
					<div className="text-lg">Loading map...</div>
				</div>
			)}
		</div>
	);
};

export default Map;
