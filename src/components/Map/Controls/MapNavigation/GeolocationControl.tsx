"use client";

import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import LocationIcon from "@/icons/mark.svg";
import locationSvgString from "@/icons/location.svg";
import { useMapStore } from "@/lib/store/mapStore";
import Feature from "ol/Feature";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import { transform } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { Icon, Style } from "ol/style";
import { FC, ReactNode, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";
import { isReducedMotionEnabled } from "@/lib/utils/motion";

interface GeolocationControlProps {
	geolocateIcon?: ReactNode;
	onGeolocate?: () => void;
}

const GeolocationControl: FC<GeolocationControlProps> = ({
	geolocateIcon = <LocationIcon className="h-6 w-6" />,
	onGeolocate,
}) => {
	const { t } = useTranslation();
	const map = useMapStore((state) => state.map);
	const setUserLocation = useMapStore((state) => state.setUserLocation);
	const userLocationLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

	useEffect(() => {
		if (!map) return;

		const vectorSource = new VectorSource();
		const vectorLayer = new VectorLayer({
			source: vectorSource,
			style: new Style({
				image: new Icon({
					anchor: [0.5, 1],
					src:
						"data:image/svg+xml;charset=utf-8," +
						encodeURIComponent(locationSvgString),
					offset: [0, 0],
					opacity: 1,
					scale: 0.8,
				}),
			}),
			zIndex: 1000,
		});

		map.addLayer(vectorLayer);
		userLocationLayerRef.current = vectorLayer;

		return () => {
			if (userLocationLayerRef.current) {
				map.removeLayer(userLocationLayerRef.current);
			}
		};
	}, [map]);

	const handleGeolocate = useCallback(() => {
		if (onGeolocate) {
			onGeolocate();
			return;
		}

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					if (!map || !userLocationLayerRef.current) return;

					const view = map.getView();
					const projection = view.getProjection();

					// Transform coordinates from WGS84 to the map projection
					const coords = transform(
						[position.coords.longitude, position.coords.latitude],
						"EPSG:4326",
						projection,
					);

					setUserLocation({
						coordinates: coords as [number, number],
						accuracy: position.coords.accuracy,
					});

					const source = userLocationLayerRef.current.getSource();
					if (source) {
						source.clear();
						const feature = new Feature({
							geometry: new Point(coords),
						});
						source.addFeature(feature);
					}

					view.animate({
						center: coords,
						zoom: 16,
						duration: isReducedMotionEnabled() ? 0 : 1000,
					});
				},
				(error) => {
					reportClientTelemetry({
						level: "warn",
						event: "map.geolocation.failed",
						error,
					});
					setUserLocation({
						coordinates: null,
						accuracy: undefined,
					});
					if (userLocationLayerRef.current) {
						const source = userLocationLayerRef.current.getSource();
						if (source) {
							source.clear();
						}
					}
				},
				{
					enableHighAccuracy: true,
					timeout: 15000,
					maximumAge: 60000,
				},
			);
		} else {
			reportClientTelemetry({
				level: "warn",
				event: "map.geolocation.unsupported",
			});
		}
	}, [map, onGeolocate, setUserLocation]);

	if (!map) return null;

	return (
		<ButtonWithTooltip
			radius="full"
			variant="surface"
			iconSize="lg"
			tooltip={t("common.map.geolocate")}
			onClick={handleGeolocate}
			className="cursor-pointer"
			aria-label={t("common.map.geolocate")}
		>
			{geolocateIcon}
		</ButtonWithTooltip>
	);
};

export default GeolocationControl;
