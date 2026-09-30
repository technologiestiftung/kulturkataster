"use client";

import { useInstitutionStore } from "@/lib/store/institutionStore";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { FC, useState } from "react";
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

// Routes that render the fixed secondary sidebar (see Menu) over the map.
const SECONDARY_SIDEBAR_ROUTE =
	/\/(?:map\/institution\/\d+|accessibilitySettings)(?:\/|$)/;

const Map: FC = () => {
	const pathname = usePathname();
	const filteredInstitutionsGeoJSON = useInstitutionStore(
		(state) => state.filteredInstitutionsGeoJSON,
	);
	const isLayerTreeOpen = useAppStore((state) => state.isLayerTreeOpen);
	const setIsLayerTreeOpen = useAppStore((state) => state.setIsLayerTreeOpen);
	const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

	return (
		<div className="Map-root w-full h-full relative">
			<SidePanel
				isBlocked={isLayerTreeOpen}
				onPanelOpen={() => setIsLayerTreeOpen(false)}
				onVisibilityChange={setIsSidePanelOpen}
			/>
			<LayerTree
				isSidePanelOpen={
					isSidePanelOpen || SECONDARY_SIDEBAR_ROUTE.test(pathname ?? "")
				}
			/>

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
