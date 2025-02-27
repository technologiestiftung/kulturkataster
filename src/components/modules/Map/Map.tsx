"use client";

import GeolocationSearch from "@/components/elements/GeolocationSearch/GeolocationSearch";
import { useMapStore } from "@/lib/store/mapStore";
import {
	AppMapMouseEvent,
	HoverCardData,
	isPoint,
	VenueProperties,
} from "@/types";
import maplibregl, { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FC, useEffect, useRef, useState } from "react";
import DetailPanel from "../DetailPanel/DetailPanel";
import HoverCard from "../HoverCard/HoverCard";

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

		map.on("mouseenter", "kulturorteLayer", handleVenueHoverIn);

		map.on("mouseleave", "kulturorteLayer", handleVenueHoverOut);

		return () => {
			if (map) {
				map.remove();
			}
		};
	}, [map]);

	const handleVenueClick = (e: AppMapMouseEvent) => {
		if (!e.features || e.features.length === 0) return;
		const feature = e.features[0];
		const geometry = feature.geometry;

		if (isPoint(geometry)) {
			const OFFSET_LNG = 0.0004;

			map?.flyTo({
				center: [geometry.coordinates[0] + OFFSET_LNG, geometry.coordinates[1]],
				zoom: 18,
				duration: 2000,
				essential: true,
			});

			setVenueProperties(feature.properties as VenueProperties);
		} else {
			console.warn("Feature geometry is not a Point, skipping flyTo.");
		}
	};

	const handleVenueHoverIn = (e: AppMapMouseEvent) => {
		if (!map || !e.features?.length) return;

		map.getCanvas().style.cursor = "pointer";

		const feature = e.features[0];
		const geometry = feature.geometry;

		if (isPoint(geometry)) {
			const coordinates = geometry.coordinates.slice();
			const name = feature.properties.venue_name;
			const point = map.project(coordinates as [number, number]);

			setHoverCardData({ x: point.x, y: point.y, venue_name: name });
		}
	};

	const handleVenueHoverOut = () => {
		if (!map) return;
		map.getCanvas().style.cursor = "";
		setHoverCardData(null);
	};

	return (
		<div className="Map-root relative w-screen h-screen">
			<GeolocationSearch />
			{venueProperties && <DetailPanel />}
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
