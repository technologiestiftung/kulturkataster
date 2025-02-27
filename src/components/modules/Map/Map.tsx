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
import HoverCard, { HoverCardData } from "../HoverCard/HoverCard";

interface MapProps {
	initialMapStyle: StyleSpecification;
}

const Map: FC<MapProps> = ({ initialMapStyle }) => {
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);
	const [loading, setLoading] = useState(true);
	const [hoverCardData, setHoverCardData] = useState<HoverCardData | null>(
		null,
	);

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

		// controls
		map.addControl(new maplibregl.ScaleControl(), "bottom-right");
		map.addControl(new maplibregl.NavigationControl(), "bottom-left");
		map.addControl(
			new maplibregl.GeolocateControl({
				positionOptions: { enableHighAccuracy: true },
				trackUserLocation: true,
			}),
		);

		// events
		map.on("click", "kulturorteLayer", handleVenueClick);

		map.on("mouseenter", "kulturorteLayer", (e) => {
			map.getCanvas().style.cursor = "pointer";

			if (!e.features?.length) return;
			const feature = e.features[0];
			const coordinates = feature.geometry.coordinates.slice();
			const description = feature.properties.description;
			const name = feature.properties.name;

			const point = map.project(coordinates);
			setHoverCardData({ x: point.x, y: point.y, description, name });
		});

		map.on("mouseleave", "kulturorteLayer", () => {
			map.getCanvas().style.cursor = "";
			setHoverCardData(null);
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

			{hoverCardData && <HoverCard data={hoverCardData} />}

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
