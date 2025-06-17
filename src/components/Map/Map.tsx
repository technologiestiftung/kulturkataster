"use client";

// import { useMapStore } from "@/lib/store/mapStore";
import { FC } from "react";
import { VectorLayer } from "./Layers";
import MapLayers from "./Layers/MapLayers";
import OlMap from "./Map/OlMap";

const Map: FC = () => {
	// const config = useMapStore((state) => state.config);
	// console.log("[Map] config::", config);

	return (
		<div className="Map-root">
			<OlMap>
				<MapLayers>
					<></>
					{/* {config!.layers[0] && (
            <TileLayer
              url={config!.layers[0].url}
              params={config!.layers[0].params}
              name="WMS-Layer"
            />
          )} */}
					{/* <TileLayer
            url={config!.layers[0].url}
            params={config!.layers[0].params}
            name="WMS-Layer"
          /> */}
					<VectorLayer />
				</MapLayers>
			</OlMap>
		</div>
	);
};

export default Map;
