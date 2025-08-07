"use client";

import { ButtonWithTooltip } from "@/components/ui/button";
import { useMapStore } from "@/lib/store/mapStore";
import { transform } from "ol/proj";
import { FC, ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";
import LocationIcon from "../../../../icons/mark.svg";

interface GeolocationControlProps {
	geolocateIcon?: ReactNode;
	onGeolocate?: () => void;
}

const GeolocationControl: FC<GeolocationControlProps> = ({
	geolocateIcon = <LocationIcon />,
	onGeolocate,
}) => {
	const { t } = useTranslation("common");
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
		<ButtonWithTooltip
			variant="map-icon"
			size="icon-only"
			tooltip={t("map.geolocate")}
			onClick={handleGeolocate}
		>
			{geolocateIcon}
		</ButtonWithTooltip>
	);
};

export default GeolocationControl;
