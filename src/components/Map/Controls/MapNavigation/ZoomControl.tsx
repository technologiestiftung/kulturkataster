"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { FC, ReactNode, useCallback, useEffect } from "react";
import MinusIcon from "../../../../icons/minus.svg";
import PlusIcon from "../../../../icons/plus.svg";

interface ZoomControlProps {
	zoomInIcon?: ReactNode;
	zoomOutIcon?: ReactNode;
}

const ZoomControl: FC<ZoomControlProps> = ({
	zoomInIcon = <PlusIcon />,
	zoomOutIcon = <MinusIcon />,
}) => {
	const map = useMapStore((state) => state.map);

	const handleZoomIn = useCallback(() => {
		if (!map) return;
		const view = map.getView();
		const zoom = view.getZoom();
		if (zoom !== undefined) {
			view.animate({ zoom: zoom + 1, duration: 250 });
		}
	}, [map]);

	const handleZoomOut = useCallback(() => {
		if (!map) return;
		const view = map.getView();
		const zoom = view.getZoom();
		if (zoom !== undefined) {
			view.animate({ zoom: zoom - 1, duration: 250 });
		}
	}, [map]);

	// Remove default zoom control
	useEffect(() => {
		if (!map) return;

		const existingControls = map.getControls().getArray();
		existingControls.forEach((control) => {
			if (control.constructor.name === "Zoom") {
				map.removeControl(control);
			}
		});
	}, [map]);

	if (!map) return null;

	return (
		<div className="zoom-control">
			<button
				type="button"
				className="zoom-in-btn"
				title="Zoom in"
				onClick={handleZoomIn}
			>
				{zoomInIcon}
			</button>
			<button
				type="button"
				className="zoom-out-btn"
				title="Zoom out"
				onClick={handleZoomOut}
			>
				{zoomOutIcon}
			</button>
		</div>
	);
};

export default ZoomControl;
