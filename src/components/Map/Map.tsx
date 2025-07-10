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

const LazyOlMap = dynamic(() => import("./Map/OlMap"), {
	ssr: false,
	loading: () => <div>Loading map container...</div>,
});

const Map: FC = () => {
	return (
		<div className="Map-root">
			{false && <LayerTree />}
			<GeolocationSearch />

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
