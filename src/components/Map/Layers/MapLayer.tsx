import { LayerElement } from "@/types";
import { FC } from "react";

interface MapLayerProps {
	layer: LayerElement;
}

const MapLayer: FC<MapLayerProps> = ({ layer }) => {
	console.log("[MapLayer] type::", layer.type);
	console.log("[MapLayer] layer::", layer);
	return <div className="MapLayer-root"></div>;
};

export default MapLayer;
