"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { FC, ReactNode, useCallback, useEffect } from "react";
import MinusIcon from "../../../icons/minus.svg";
import PlusIcon from "../../../icons/plus.svg";
import BaseControl from "./BaseControl";

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
		console.log("[ZoomControl] existingControls::", existingControls);
		existingControls.forEach((control) => {
			if (control.constructor.name === "Zoom") {
				map.removeControl(control);
			}
		});
	}, [map]);

	if (!map) return null;

	return (
		<>
			<BaseControl
				icon={zoomInIcon}
				title="Zoom in"
				onClick={handleZoomIn}
				className="zoom-in-control"
			/>
			<BaseControl
				icon={zoomOutIcon}
				title="Zoom out"
				onClick={handleZoomOut}
				className="zoom-out-control"
			/>
		</>
	);
};

export default ZoomControl;
