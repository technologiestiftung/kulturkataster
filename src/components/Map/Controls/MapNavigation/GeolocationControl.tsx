"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { transform } from "ol/proj";
import { FC, ReactNode, useCallback } from "react";
import LocationIcon from "../../../../icons/mark.svg";

interface GeolocationControlProps {
	geolocateIcon?: ReactNode;
	onGeolocate?: () => void;
}

const GeolocationControl: FC<GeolocationControlProps> = ({
	geolocateIcon = <LocationIcon />,
	onGeolocate,
}) => {
	const map = useMapStore((state) => state.map);

	const handleGeolocate = useCallback(() => {
		if (onGeolocate) {
			onGeolocate();
			return;
		}

		// Default geolocation behavior
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					if (!map) return;

					const view = map.getView();
					const projection = view.getProjection();

					// Transform coordinates from WGS84 to the map projection
					const coords = transform(
						[position.coords.longitude, position.coords.latitude],
						"EPSG:4326",
						projection,
					);

					view.animate({
						center: coords,
						zoom: 16,
						duration: 1000,
					});
				},
				(error) => {
					console.error("Geolocation error:", error);
					// Could add user-facing error handling here
				},
				{
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 60000,
				},
			);
		} else {
			console.error("Geolocation is not supported by this browser.");
		}
	}, [map, onGeolocate]);

	if (!map) return null;

	return (
		<div className="geolocation-control">
			<button
				type="button"
				className="geolocation-btn"
				title="Go to my location"
				onClick={handleGeolocate}
			>
				{geolocateIcon}
			</button>
		</div>
	);
};

export default GeolocationControl;
