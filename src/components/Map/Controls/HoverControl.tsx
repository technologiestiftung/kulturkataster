/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMapStore } from "@/lib/store/mapStore";
import Overlay from "ol/Overlay.js";
import {
	cloneElement,
	FC,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

interface HoverControlProps {
	layerId: string;
	overlayOptions?: any;
	children: React.ReactElement;
}

type OverlayPositioning =
	| "bottom-left"
	| "bottom-center"
	| "bottom-right"
	| "center-left"
	| "center-center"
	| "center-right"
	| "top-left"
	| "top-center"
	| "top-right";

const HoverControl: FC<HoverControlProps> = ({
	layerId,
	overlayOptions,
	children,
}) => {
	const map = useMapStore((state) => state.map);
	const overlayRef = useRef<HTMLDivElement>(null);
	const overlaySizeRef = useRef({ width: 0, height: 0 });

	const [features, setFeatures] = useState<any>();
	const [cardPosition, setCardPosition] =
		useState<OverlayPositioning>("bottom-left");
	const [overlayReady, setOverlayReady] = useState(false);

	// Memoized function to calculate the best position
	const calculatePositioning = useCallback(
		// eslint-disable-next-line complexity
		(pixel: [number, number]): OverlayPositioning => {
			if (!map) return "top-left";

			const mapSize = map.getSize();
			if (!mapSize) return "top-left";

			const { width: overlayWidth, height: overlayHeight } =
				overlaySizeRef.current;

			if (overlayWidth === 0 || overlayHeight === 0) return cardPosition;

			const [mapWidth, mapHeight] = mapSize;

			const [pixelX, pixelY] = pixel;
			const buffer = 10;

			let vertical: "top" | "center" | "bottom" = "top";
			let horizontal: "left" | "center" | "right" = "left";

			if (pixelY + overlayHeight + buffer > mapHeight) {
				vertical = "bottom";
			} else if (
				pixelY - overlayHeight / 2 > buffer &&
				pixelY + overlayHeight / 2 < mapHeight - buffer
			) {
				vertical = "center";
			}

			if (pixelX + overlayWidth + buffer > mapWidth) {
				horizontal = "right";
			} else if (
				pixelX - overlayWidth / 2 > buffer &&
				pixelX + overlayWidth / 2 < mapWidth - buffer
			) {
				horizontal = "center";
			}

			return `${vertical}-${horizontal}` as OverlayPositioning;
		},
		[map, cardPosition],
	);

	useEffect(() => {
		if (!map || !overlayRef.current) return;

		const overlay = new Overlay({
			element: overlayRef.current,
			id: "HoverControl-root",
			positioning: cardPosition,
			...overlayOptions,
		});

		map.addOverlay(overlay);

		const handlePointerMove = (evt: any) => {
			const pixel = evt.pixel;
			const coordinate = evt.coordinate;
			let featuresFound = false;

			const newPositioning = calculatePositioning(pixel);

			if (newPositioning !== cardPosition) {
				setCardPosition(newPositioning);
			}

			map.forEachFeatureAtPixel(pixel, function (_features, layer) {
				const _layerId = layer.get("id");

				if (_layerId === layerId) {
					overlay.setPosition(coordinate);
					featuresFound = true;

					if (_features !== features) {
						setFeatures(_features);
					}
					return true;
				}
			});
			if (!featuresFound) {
				overlay.setPosition(undefined);
				setFeatures(undefined);
			}
		};

		map.on("pointermove", handlePointerMove);

		return () => {
			map.un("pointermove", handlePointerMove);
			map.removeOverlay(overlay);
		};
	}, [
		map,
		layerId,
		overlayOptions,
		cardPosition,
		calculatePositioning,
		features,
	]);

	useEffect(() => {
		if (!overlayRef.current) return;

		requestAnimationFrame(() => {
			const rect = overlayRef.current?.getBoundingClientRect();
			if (rect) {
				overlaySizeRef.current = {
					width: rect.width,
					height: rect.height,
				};
				setOverlayReady(true);
			}
		});
	}, [features]);

	useEffect(() => {
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				overlaySizeRef.current = { width, height };
			}
		});

		if (overlayRef.current) {
			observer.observe(overlayRef.current);
		}

		return () => observer.disconnect();
	}, []);

	return (
		<div
			className={`ClickControl-root`}
			ref={overlayRef}
			style={{
				visibility: overlayReady ? "visible" : "hidden",
			}}
		>
			{features &&
				children &&
				cloneElement(children as React.ReactElement<any>, {
					features,
				})}
		</div>
	);
};

export default HoverControl;
