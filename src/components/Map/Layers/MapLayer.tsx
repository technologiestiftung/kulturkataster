import { LayerElement } from "@/types";
import { FC } from "react";

interface MapLayerProps {
	type: "wms" | "wfs" | "vector" | "wmts";
	layer: LayerElement;
}

const MapLayer: FC<MapLayerProps> = ({ type = "wms", layer }) => {
  console.log("[MapLayer] type::", type);
  console.log('[MapLayer] layer::', layer);
	return <div className="MapLayer-root"></div>;
};

export default MapLayer;
