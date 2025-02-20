"use client";

import GeolocationSearch from "@/components/elements/GeolocationSearch/GeolocationSearch";
import { useMapStore } from "@/lib/store/mapStore";
import maplibregl, { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FC, useEffect, useRef, useState } from "react";

interface MapProps {
	initialMapStyle: StyleSpecification; // More meaningful name
	onMapClick?: (e: maplibregl.MapMouseEvent) => void;
}

const Map: FC<MapProps> = ({ onMapClick, initialMapStyle }) => {
	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<maplibregl.Map | null>(null);
	const [loading, setLoading] = useState(true);

	const { mapStyle, setMapStyle } = useMapStore();

	useEffect(() => {
		if (mapStyle !== initialMapStyle) {
			setMapStyle(initialMapStyle);
		}
	}, [initialMapStyle, mapStyle, setMapStyle]);

	useEffect(() => {
		if (!mapContainer.current || !mapStyle) return;

		map.current = new maplibregl.Map({
			container: mapContainer.current,
			style: mapStyle,
			attributionControl: false,
		});

		// Add controls
		map.current.addControl(new maplibregl.ScaleControl(), "bottom-right");
		map.current.addControl(new maplibregl.NavigationControl(), "bottom-left");
		map.current.addControl(
			new maplibregl.GeolocateControl({
				positionOptions: { enableHighAccuracy: true },
				trackUserLocation: true,
			}),
		);

		map.current.on("load", () => setLoading(false));

		if (onMapClick) {
			map.current.on("click", onMapClick);
		}

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
		<div className="Map-root relative w-screen h-screen">
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
