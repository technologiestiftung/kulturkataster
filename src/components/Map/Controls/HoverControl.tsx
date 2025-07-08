/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMapStore } from "@/lib/store/mapStore";
import Overlay from "ol/Overlay.js";
import { cloneElement, FC, useEffect, useRef, useState } from "react";

interface HoverControlProps {
	layerId: string;
	overlayOptions?: any;
	children: React.ReactElement;
}

const HoverControl: FC<HoverControlProps> = ({
	layerId,
	overlayOptions,
	children,
}) => {
	const map = useMapStore((state) => state.map);
	const overlayRef = useRef<HTMLDivElement>(null);

	const [feature, setFeature] = useState<any>();

	useEffect(() => {
		if (!map || !overlayRef.current) return;

		const overlay = new Overlay({
			element: overlayRef.current,
			// autoPan: true,
			id: "HoverControl-root",
			...overlayOptions,
		});

		map.addOverlay(overlay);

		const handlePointerMove = (evt: any) => {
			const pixel = evt.pixel;
			const coordinate = evt.coordinate;
			let featureFound = false;

			map.forEachFeatureAtPixel(pixel, function (_feature, layer) {
				const _layerId = layer.get("id");

				if (_layerId === layerId) {
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
	}, [map, layerId, overlayOptions]);

	return (
		<div ref={overlayRef} className="ClickControl-root">
			{children &&
				cloneElement(children as React.ReactElement<any>, {
					properties: feature?.getProperties(),
				})}
		</div>
	);
};

export default HoverControl;
