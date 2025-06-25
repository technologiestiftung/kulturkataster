/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMapStore } from "@/lib/store/mapStore";
import Overlay from "ol/Overlay.js";
import { cloneElement, FC, useEffect, useRef, useState } from "react";

interface ClickControlProps {
	layerId: string;
	children: React.ReactElement;
}

const ClickControl: FC<ClickControlProps> = ({ layerId, children }) => {
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

		map.on("singleclick", function (evt) {
			const pixel = evt.pixel;
			const _coordinate = evt.coordinate;

			map.forEachFeatureAtPixel(pixel, function (_feature, layer) {
				const _layerId = layer.get("id");

				if (_layerId === layerId) {
					console.log("Feature clicked on target layer:", _feature);
					overlay.setPosition(_coordinate);
					setFeature(_feature);
					return true;
				}
			});
		});

		return () => {
			map.removeOverlay(overlay);
		};
	}, [map, layerId]);
	return (
		<div ref={overlayRef} className="ClickControl-root">
			{children &&
				cloneElement(children, {
					properties: feature?.getProperties(),
				})}
		</div>
	);
};

export default ClickControl;
