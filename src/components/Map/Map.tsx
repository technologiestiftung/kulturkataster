"use client";

import dynamic from "next/dynamic";
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
import { Layers, VenueLayer } from "./Layers";
import LayerTree from "./LayerTree/LayerTree";

const LazyOlMap = dynamic(() => import("./OlMap/OlMap"), {
	ssr: false,
	loading: () => <div>Loading map container...</div>,
});

// TODO: fix performance
// TODO: fix hover card for zoom level
// TODO: fix Geolocate
//

const Map: FC = () => {
	return (
		<div className="Map-root w-full h-full">
			{false && <LayerTree />}

			<LazyOlMap>
				<LayerInitializer />
				{/* venue layer */}
				<Layers>
					<VenueLayer />
				</Layers>

				<MapControls>
					<FullScreenControl />
					<ZoomControl />
					{true && <GeolocationControl />}
					{true && (
						<HoverControl
							layerId="venues"
							minZoomForHover={3}
							// overlayOptions={
							// 	{ autoPan: true }
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
			</LazyOlMap>
		</div>
	);
};

export default Map;
