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
import { Loading } from "../ui/loading";

const LazyOlMap = dynamic(() => import("./OlMap/OlMap"), {
	ssr: false,
	loading: () => (
		<div className="Map-root w-full h-full flex items-center justify-center">
			<Loading size="lg" />
		</div>
	),
});

const Map: FC = () => {
	const institutions = useInstitutionStore(
		(state) => state.filteredInstitutions,
	);

	return (
		<div className="Map-root w-full h-full">
			{true && <LayerTree />}

			<LazyOlMap>
				<LayerInitializer />
				<Layers>
					{institutions && <InstitutionLayer institutionsData={institutions} />}
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
