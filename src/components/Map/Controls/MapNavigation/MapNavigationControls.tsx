"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { FC } from "react";
import GeolocationControl from "./GeolocationControl";
import LayerTreeControl from "./LayerTreeControl";
import ZoomControl from "./ZoomControl";

interface MapNavigationControlsProps {
	onGeolocate?: () => void;
}

const MapNavigationControls: FC<MapNavigationControlsProps> = ({
	onGeolocate,
}) => {
	const { isMobile, openMobile } = useSidebar();

	return (
		<div
			className={`absolute pb-12 md:pb-0 bottom-10 right-4 flex flex-col gap-2 z-10 ${isMobile && openMobile ? "hidden" : ""}`}
		>
			{/* LayerTree button - only on mobile */}
			{isMobile && (
				<div className="relative">
					<LayerTreeControl />
				</div>
			)}
			<div className="relative">
				<GeolocationControl onGeolocate={onGeolocate} />
			</div>
			<div className="relative">
				<ZoomControl />
			</div>
		</div>
	);
};
export default MapNavigationControls;
