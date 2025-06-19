"use client";

import { FC } from "react";
import LayerInitializer from "./LayerInitializer/LayerInitializer";
import { VectorLayer } from "./Layers";
import MapLayers from "./Layers/MapLayers";
import LayerTree from "./LayerTree/LayerTree";
import OlMap from "./Map/OlMap";

const Map: FC = () => {
	return (
		<div className="Map-root">
			<LayerTree />
			<OlMap>
				<LayerInitializer />

				{/* NOTE: add extra layers if needed */}
				<MapLayers>
					<VectorLayer />
				</MapLayers>
			</OlMap>
		</div>
	);
};

export default Map;
