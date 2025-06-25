/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMapStore } from "@/lib/store/mapStore";
import Overlay from "ol/Overlay.js";
import { cloneElement, FC, useEffect, useRef, useState } from "react";

interface HoverControlProps {
	layerId: string;
	children: React.ReactElement;
}

const HoverControl: FC<HoverControlProps> = ({ layerId, children }) => {
	const map = useMapStore((state) => state.map);
	const overlayRef = useRef<HTMLDivElement>(null);

	const [feature, setFeature] = useState<any>();

	useEffect(() => {
		if (!map || !overlayRef.current) return;

		const overlay = new Overlay({
			element: overlayRef.current,
			autoPan: true,
			id: "HoverControl-root",
		});

		map.addOverlay(overlay);

		const handlePointerMove = (evt: any) => {
			const pixel = evt.pixel;
			const coordinate = evt.coordinate;
			let featureFound = false;

			map.forEachFeatureAtPixel(pixel, function (_feature, layer) {
				const _layerId = layer.get("id");

				if (_layerId === layerId) {
					console.log("Feature hovered on target layer:", _feature);
					overlay.setPosition(coordinate);
					featureFound = true;
					setFeature(_feature);
					return true;
				}
			});
			if (!featureFound) {
				overlay.setPosition(undefined);
			}
		};

		map.on("pointermove", handlePointerMove);

		return () => {
			map.un("pointermove", handlePointerMove);
			map.removeOverlay(overlay);
		};
	}, [map, layerId]);

	return (
		<div ref={overlayRef} className="HoverControl-root">
			{children &&
				cloneElement(children, {
					properties: feature?.getProperties(),
				})}
		</div>
	);
};

export default HoverControl;
