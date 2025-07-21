"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { FC, ReactNode, useEffect, useRef } from "react";
import { createRoot, Root } from "react-dom/client";

interface ZoomControlProps {
	/** Icon for zoom in button */
	zoomInIcon?: ReactNode;
	/** Icon for zoom out button */
	zoomOutIcon?: ReactNode;
}

const ZoomControl: FC<ZoomControlProps> = ({
	zoomInIcon = "+",
	zoomOutIcon = "−",
}) => {
	const map = useMapStore((state) => state.map);
	const zoomInRootRef = useRef<Root | null>(null);
	const zoomOutRootRef = useRef<Root | null>(null);

	useEffect(() => {
		if (!map) return;

		// Remove existing zoom control if any
		const existingControls = map.getControls().getArray();
		existingControls.forEach((control) => {
			if (control.constructor.name === "Zoom") {
				map.removeControl(control);
			}
		});

		// Add custom zoom buttons
		const zoomContainer = document.createElement("div");
		zoomContainer.className = "ol-zoom ol-unselectable ol-control";

		const zoomInBtn = document.createElement("button");
		zoomInBtn.type = "button";
		zoomInBtn.title = "Zoom in";
		zoomInBtn.addEventListener("click", () => {
			const view = map.getView();
			const zoom = view.getZoom();
			if (zoom !== undefined) {
				view.animate({ zoom: zoom + 1, duration: 250 });
			}
		});

		const zoomOutBtn = document.createElement("button");
		zoomOutBtn.type = "button";
		zoomOutBtn.title = "Zoom out";
		zoomOutBtn.addEventListener("click", () => {
			const view = map.getView();
			const zoom = view.getZoom();
			if (zoom !== undefined) {
				view.animate({ zoom: zoom - 1, duration: 250 });
			}
		});

		// Set icons
		if (typeof zoomInIcon === "string") {
			zoomInBtn.innerHTML = zoomInIcon;
		} else if (zoomInIcon) {
			// For React nodes, create a React root and render the icon
			const zoomInContainer = document.createElement("div");
			zoomInBtn.appendChild(zoomInContainer);
			zoomInRootRef.current = createRoot(zoomInContainer);
			zoomInRootRef.current.render(zoomInIcon);
		}

		if (typeof zoomOutIcon === "string") {
			zoomOutBtn.innerHTML = zoomOutIcon;
		} else if (zoomOutIcon) {
			// For React nodes, create a React root and render the icon
			const zoomOutContainer = document.createElement("div");
			zoomOutBtn.appendChild(zoomOutContainer);
			zoomOutRootRef.current = createRoot(zoomOutContainer);
			zoomOutRootRef.current.render(zoomOutIcon);
		}

		zoomContainer.appendChild(zoomInBtn);
		zoomContainer.appendChild(zoomOutBtn);
		map.getViewport().appendChild(zoomContainer);

		return () => {
			// Clean up React roots
			if (zoomInRootRef.current) {
				zoomInRootRef.current.unmount();
				zoomInRootRef.current = null;
			}
			if (zoomOutRootRef.current) {
				zoomOutRootRef.current.unmount();
				zoomOutRootRef.current = null;
			}

			if (zoomContainer.parentNode) {
				zoomContainer.parentNode.removeChild(zoomContainer);
			}
		};
	}, [map, zoomInIcon, zoomOutIcon]);

	return null;
};

export default ZoomControl;
