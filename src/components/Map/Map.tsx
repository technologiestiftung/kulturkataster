"use client";

import { useVenueStore } from "@/lib/store/venueStore";
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
	const venues = useVenueStore((state) => state.venues);

	return (
		<div className="Map-root w-full h-full">
			{true && <LayerTree />}

			<LazyOlMap>
				<LayerInitializer />
				<Layers>{venues && <VenueLayer venuesData={venues} />}</Layers>

				<MapControls>
					<MapNavigationControls />
					<HoverControl
						layerId="venues"
						minZoomForHover={0}
						overlayOptions={{
							offset: [8, 8],
						}}
					>
						<HoverCard />
					</HoverControl>
					<ClickControl layerId="venues" />
				</MapControls>
			</LazyOlMap>
		</div>
	);
};

export default Map;
