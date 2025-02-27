"use client";

import GeolocationSearch from "@/components/elements/GeolocationSearch/GeolocationSearch";
import { useMapStore } from "@/lib/store/mapStore";
import maplibregl, { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FC, useEffect, useRef, useState } from "react";

interface MapProps {
	initialMapStyle: StyleSpecification;
}

const Map: FC<MapProps> = ({ initialMapStyle }) => {
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);
	const [loading, setLoading] = useState(true);

	const { mapStyle, setMapStyle, map, setMap } = useMapStore();

	useEffect(() => {
		if (mapStyle !== initialMapStyle) {
			setMapStyle(initialMapStyle);
		}
	}, [initialMapStyle, mapStyle, setMapStyle]);

	useEffect(() => {
		if (!mapContainer.current || !mapStyle) return;

		mapRef.current = new maplibregl.Map({
			container: mapContainer.current,
			style: mapStyle,
			attributionControl: false,
			maxBounds: [
				13.091992716067702, 52.33488609760638, 13.742786470433,
				52.67626223889507,
			] as maplibregl.LngLatBoundsLike,
		});

		mapRef.current.on("load", () => {
			setLoading(false);
			if (mapRef.current) {
				setMap(mapRef.current);
			}
		});
	}, [mapStyle, setMap]);

	useEffect(() => {
		if (!map) return;

		// Add controls
		map.addControl(new maplibregl.ScaleControl(), "bottom-right");
		map.addControl(new maplibregl.NavigationControl(), "bottom-left");
		map.addControl(
			new maplibregl.GeolocateControl({
				positionOptions: { enableHighAccuracy: true },
				trackUserLocation: true,
			}),
		);

		return () => {
			if (map) {
				map.remove();
			}
		};
	}, [map]);

	return (
		<div className="Map-root relative w-screen h-screen">
			<GeolocationSearch map={map} />
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
