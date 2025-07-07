"use client";

import { FC } from "react";
import GeolocationSearch from "../GeolocationSearch/GeolocationSearch";
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

const Map: FC = () => {
	return (
		<div className="Map-root">
			{true && <LayerTree />}
			<GeolocationSearch />
			<OlMap>
				<LayerInitializer />
				{/* venue layer */}
				<VenueLayer />

				<MapControls>
					<FullScreenControl />
					<ZoomControl />
					{false && <GeolocationControl />}
					{true && (
						<HoverControl
							layerId="venues"
							// overlayOptions={
							// 	// { autoPan: true }
							// }
						>
							<HoverCard />
						</HoverControl>
					)}
					{false && (
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
