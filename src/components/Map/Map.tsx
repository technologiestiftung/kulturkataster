"use client";

import { FC } from "react";
import { FullScreenControl, MapControls } from "./Controls";
import GeolocationControl from "./Controls/GeolocationControl";
import ZoomControl from "./Controls/ZoomControl";
import LayerInitializer from "./LayerInitializer/LayerInitializer";
import { VenueLayer } from "./Layers";
import LayerTree from "./LayerTree/LayerTree";
import OlMap from "./Map/OlMap";

// todo: check own basemap integration
// todo: add hover effects
// todo: add details card

const Map: FC = () => {
	return (
		<div className="Map-root">
			{false && <LayerTree />}
			<OlMap>
				<LayerInitializer />
				{/* venue layer */}
				<VenueLayer />

				<MapControls>
					<FullScreenControl />
					<ZoomControl />
					{false && <GeolocationControl />}
				</MapControls>
			</OlMap>
		</div>
	);
};

export default Map;
