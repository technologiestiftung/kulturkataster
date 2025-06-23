"use client";

import { FC } from "react";
import LayerInitializer from "./LayerInitializer/LayerInitializer";
import { VenueLayer } from "./Layers";
import LayerTree from "./LayerTree/LayerTree";
import OlMap from "./Map/OlMap";

// todo: load kuka layer from BE
// todo: check own basemap integration
// todo: add hover effects
// todo: add details card

const Map: FC = () => {
	return (
		<div className="Map-root">
			<LayerTree />
			<OlMap>
				<LayerInitializer />
				{/* venue layer */}
				<VenueLayer />
			</OlMap>
		</div>
	);
};

export default Map;
