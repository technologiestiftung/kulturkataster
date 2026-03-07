"use client";

import { useInstitutionStore } from "@/lib/store/institutionStore";
import dynamic from "next/dynamic";
import { FC } from "react";
import HoverCard from "../HoverCard/HoverCard";
import { ClickControl, HoverControl, MapControls } from "./Controls";
import MapNavigationControls from "./Controls/MapNavigation/MapNavigationControls";
import LayerInitializer from "./LayerInitializer/LayerInitializer";
import { InstitutionLayer, Layers } from "./Layers";
import LayerTree from "./LayerTree/LayerTree";
import { SidePanel } from "../Menu/MenuContent/SidePanel";
import { useAppStore } from "@/lib/store/appStore";
import { MapSkeleton } from "./MapSkeleton";

const LazyOlMap = dynamic(() => import("./OlMap/OlMap"), {
	ssr: false,
	loading: () => <MapSkeleton />,
});

const Map: FC = () => {
	const filteredInstitutionsGeoJSON = useInstitutionStore(
		(state) => state.filteredInstitutionsGeoJSON,
	);
	const isLayerTreeOpen = useAppStore((state) => state.isLayerTreeOpen);
	const setIsLayerTreeOpen = useAppStore((state) => state.setIsLayerTreeOpen);

	return (
		<div className="Map-root w-full h-full relative">
			<SidePanel
				isBlocked={isLayerTreeOpen}
				onPanelOpen={() => setIsLayerTreeOpen(false)}
			/>
			{true && <LayerTree />}

			<LazyOlMap>
				<LayerInitializer />
				<Layers>
					{filteredInstitutionsGeoJSON && (
						<InstitutionLayer institutions={filteredInstitutionsGeoJSON} />
					)}
				</Layers>

				<MapControls>
					<MapNavigationControls />
					<HoverControl layerId="institutions" minZoomForHover={0}>
						<HoverCard />
					</HoverControl>
					<ClickControl layerId="institutions" />
				</MapControls>
			</LazyOlMap>
		</div>
	);
};

export default Map;
