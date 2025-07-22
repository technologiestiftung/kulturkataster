"use client";

import { FC } from "react";
import GeolocationControl from "./GeolocationControl";
import ZoomControl from "./ZoomControl";

interface MapNavigationControlsProps {
	onGeolocate?: () => void;
}

const MapNavigationControls: FC<MapNavigationControlsProps> = ({
	onGeolocate,
}) => {
	return (
		<div className="map-navigation-controls">
			<div className="nav-control-wrapper">
				<GeolocationControl onGeolocate={onGeolocate} />
			</div>
			<div className="nav-control-wrapper">
				<ZoomControl />
			</div>
		</div>
	);
};

export default MapNavigationControls;
