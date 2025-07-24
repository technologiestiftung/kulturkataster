"use client";

import dynamic from "next/dynamic";
import { FC } from "react";
import HoverCard from "../HoverCard/HoverCard";
import { ClickControl, HoverControl, MapControls } from "./Controls";
import MapNavigationControls from "./Controls/MapNavigation/MapNavigationControls";
import LayerInitializer from "./LayerInitializer/LayerInitializer";
import { Layers, VenueLayer } from "./Layers";
import LayerTree from "./LayerTree/LayerTree";

const LazyOlMap = dynamic(() => import("./OlMap/OlMap"), {
	ssr: false,
	loading: () => <div>Loading map container...</div>,
});

const Map: FC = () => {
	return (
		<div className="Map-root">
			{true && <LayerTree />}

			<LazyOlMap>
				<LayerInitializer />
				{/* venue layer */}
				<Layers>
					<VenueLayer />
				</Layers>

				<MapControls>
					<MapNavigationControls />
					{true && (
						<HoverControl
							layerId="venues"
							minZoomForHover={3}
							overlayOptions={{
								offset: [8, 8],
							}}
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
