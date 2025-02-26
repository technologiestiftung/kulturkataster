"use client";

import GeolocationSearch from "@/components/elements/GeolocationSearch/GeolocationSearch";
import VenueOverlay from "@/components/modules/Overlay/VenueOverlay";
import { useMapStore } from "@/lib/store/mapStore";
import maplibregl, {
	MapGeoJSONFeature,
	MapMouseEvent,
	StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FC, useEffect, useRef, useState } from "react";

interface MapProps {
	initialMapStyle: StyleSpecification;
}

const Map: FC<MapProps> = ({ initialMapStyle }) => {
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);
	const [loading, setLoading] = useState(true);

	const {
		mapStyle,
		setMapStyle,
		map,
		setMap,
		venueProperties,
		setVenueProperties,
	} = useMapStore();

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

		map.on("click", "kulturorteLayer", handleVenueClick);

		// Change the cursor to a pointer when the it enters a feature in the 'symbols' layer.
		map.on("mouseenter", "kulturorteLayer", () => {
			map.getCanvas().style.cursor = "pointer";
		});

		// Change it back to a pointer when it leaves.
		map.on("mouseleave", "kulturorteLayer", () => {
			map.getCanvas().style.cursor = "";
		});

		return () => {
			if (map) {
				map.remove();
			}
		};
	}, [map]);

	const handleVenueClick = (
		e: MapMouseEvent & { features?: MapGeoJSONFeature[] } & object,
	) => {
		if (!e.features) return;

		const OFFSET_LNG = 0.0004;

		map?.flyTo({
			center: [
				e.features[0].geometry.coordinates[0] + OFFSET_LNG,
				e.features[0].geometry.coordinates[1],
			],
			zoom: 18,
			duration: 2000,
			essential: true,
		});

		setVenueProperties(e.features[0].properties);
	};

	return (
		<div className="Map-root relative w-screen h-screen">
			<GeolocationSearch map={map} />
			{venueProperties && <VenueOverlay />}

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
