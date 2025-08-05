"use client";

import { filterInstitutions, getInstitutionsGeoJSON } from "@/lib/supabase/api";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import dynamic from "next/dynamic";
import { FC, useEffect, useState } from "react";
import HoverCard from "../HoverCard/HoverCard";
import { ClickControl, HoverControl, MapControls } from "./Controls";
import MapNavigationControls from "./Controls/MapNavigation/MapNavigationControls";
import LayerInitializer from "./LayerInitializer/LayerInitializer";
import { Layers, VenueLayer } from "./Layers";
import LayerTree from "./LayerTree/LayerTree";
import { useVenueStore } from "@/lib/store/venueStore";

const LazyOlMap = dynamic(() => import("./OlMap/OlMap"), {
	ssr: false,
	loading: () => <div>Loading map container...</div>,
});

const Map: FC = () => {
	const [venuesData, setVenuesData] = useState<FeatureCollection<
		Geometry,
		GeoJsonProperties
		> | null>(null);
	
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const filters = useVenueStore((state) => state.filters);

	useEffect(() => {
		const fetchVenues = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await getInstitutionsGeoJSON();
				const filteredData = await filterInstitutions(filters);

				console.log("[Map] data::", data);

				setVenuesData(filteredData);
			} catch (err) {
				console.error("Failed to fetch venues data:", err);
				setError(
					err instanceof Error ? err.message : "Failed to fetch venues data",
				);
			} finally {
				setLoading(false);
			}
		};

		fetchVenues();
	}, []);

	if (loading) {
		console.log("Loading venues data...");
	}

	if (error) {
		console.error("Venues layer error:", error);
	}

	return (
		<div className="Map-root w-full h-full">
			{true && <LayerTree />}

			<LazyOlMap>
				<LayerInitializer />
				<Layers>{venuesData && <VenueLayer venuesData={venuesData} />}</Layers>

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
