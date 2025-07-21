/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMapStore } from "@/lib/store/mapStore";
import { ReactNode, useEffect, useRef } from "react";
import { createRoot, Root } from "react-dom/client";

interface UseMapControlOptions {
	className?: string;
	position?: {
		bottom?: string;
		right?: string;
		top?: string;
		left?: string;
	};
}

export const useMapControl = (options: UseMapControlOptions = {}) => {
	const map = useMapStore((state) => state.map);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const rootRef = useRef<Root | null>(null);
	const buttonCreatedRef = useRef(false);

	useEffect(() => {
		if (!map) return;

		// Create container
		const container = document.createElement("div");
		container.className = `ol-control ${options.className || ""}`;

		// Apply positioning
		if (options.position) {
			Object.entries(options.position).forEach(([key, value]) => {
				if (value) {
					container.style[key as any] = value;
				}
			});
		}

		containerRef.current = container;
		buttonCreatedRef.current = false; // Reset button creation flag
		map.getViewport().appendChild(container);

		return () => {
			if (rootRef.current) {
				rootRef.current.unmount();
				rootRef.current = null;
			}
			if (container.parentNode) {
				container.parentNode.removeChild(container);
			}
			containerRef.current = null;
			buttonCreatedRef.current = false;
		};
	}, [map, options.className, options.position]);

	const renderButton = (
		icon: ReactNode,
		onClick: () => void,
		title: string,
	) => {
		if (!containerRef.current || buttonCreatedRef.current) return;

		const button = document.createElement("button");
		button.type = "button";
		button.title = title;
		button.addEventListener("click", onClick);

		if (typeof icon === "string") {
			button.innerHTML = icon;
		} else if (icon) {
			const iconContainer = document.createElement("div");
			button.appendChild(iconContainer);

			// Create a new root for this specific button
			const buttonRoot = createRoot(iconContainer);
			buttonRoot.render(icon);
		}

		containerRef.current.appendChild(button);
		buttonCreatedRef.current = true; // Mark button as created
		return button;
	};

	return { containerRef, renderButton };
};
