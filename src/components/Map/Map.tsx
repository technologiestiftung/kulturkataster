"use client";

import { FC } from "react";
import HoverCard from "../HoverCard/HoverCard";
import {
	ClickControl,
	FullScreenControl,
	GeolocationControl,
	HoverControl,
	MapControls,
	ZoomControl,
} from "./Controls";
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
			{true && <LayerTree />}
			<OlMap>
				<LayerInitializer />
				{/* venue layer */}
				<VenueLayer />

				<MapControls>
					<FullScreenControl />
					<ZoomControl />
					{false && <GeolocationControl />}
					{true && (
						<HoverControl layerId="venues">
							<HoverCard />
						</HoverControl>
					)}
					{true && (
						<ClickControl layerId="alkis_bezirke:wfs:bezirksgrenzen">
							<HoverCard />
						</ClickControl>
					)}
				</MapControls>
			</OlMap>
		</div>
	);
};

export default Map;
