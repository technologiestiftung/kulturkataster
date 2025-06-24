import { useMapStore } from "@/lib/store/mapStore";
import Overlay from "ol/Overlay.js";
import { FC, useEffect, useRef } from "react";

interface ClickControlProps {
	layerId?: string;
	children: React.ReactNode;
}

const ClickControl: FC<ClickControlProps> = ({ layerId, children }) => {
	const map = useMapStore((state) => state.map);
	const overlayRef = useRef<HTMLDivElement>(null);

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
			const coordinate = evt.coordinate;

			map.forEachFeatureAtPixel(pixel, function (feature, layer) {
				const _layerId = layer.get("id");
				
				if (_layerId === layerId) {
					console.log("Feature clicked on target layer:", feature);
					overlay.setPosition(coordinate);
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
			{" "}
			{children}
		</div>
	);
};

export default ClickControl;
