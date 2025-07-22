"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { getInstitutionsGeoJSON } from "@/lib/supabase/api";
import { transformGeoJSON } from "@/lib/utils/mapUtils";
import { MapStoreState } from "@/types/map";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { FeatureLike } from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import { Vector as VectorSource } from "ol/source";
import Cluster from "ol/source/Cluster";
import { Fill, Icon, Stroke, Style, Text } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { FC, useCallback, useEffect, useState } from "react";

interface VenueLayerProps {
	zIndex?: number;
	distance?: number;
	minZoomForClustering?: number;
	maxZoomForClustering?: number;
}

const VenueLayer: FC<VenueLayerProps> = ({
	zIndex = 10000,
	distance = 60,
	minZoomForClustering = 0,
	maxZoomForClustering = 4,
}) => {
	const map = useMapStore((state: MapStoreState) => state.map);
	const config = useMapStore((state) => state.config);
	const [venuesData, setVenuesData] = useState<FeatureCollection<
		Geometry,
		GeoJsonProperties
	> | null>(null);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch venues data on component mount
	useEffect(() => {
		const fetchVenues = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await getInstitutionsGeoJSON();

				console.log("[VenueLayer] data::", data);

				setVenuesData(data);
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

	const styleFunction = function (feature: FeatureLike) {
		const features = feature.get("features");
		const size = features ? features.length : 1;

		if (size === 1) {
			const scale = 1.2;

			return new Style({
				image: new Icon({
					anchor: [0.5, 1],
					src: "/icons/test.svg",
					offset: [0, 0],
					opacity: 1,
					scale,
				}),
			});
		}

		let radius = 15;
		let color = "#6B46C1";

		if (size > 1000) {
			radius = 30;
			color = "#553C9A";
		} else if (size > 500) {
			radius = 27;
			color = "#6B46C1";
		} else if (size > 200) {
			radius = 25;
			color = "#7C3AED";
		} else if (size > 100) {
			radius = 22;
			color = "#8B5CF6";
		} else if (size > 50) {
			radius = 19;
			color = "#9F7AEA";
		} else if (size > 20) {
			radius = 16;
			color = "#A78BFA";
		}

		return new Style({
			image: new CircleStyle({
				radius: radius,
				fill: new Fill({
					color: color,
				}),
				stroke: new Stroke({
					color: "#FFFFFF",
					width: 2,
				}),
			}),
			text: new Text({
				text: size.toString(),
				font: `bold ${Math.min(radius * 0.6, 14)}px sans-serif`,
				fill: new Fill({
					color: "#FFFFFF",
				}),
				offsetY: 0,
			}),
		});
	};

	const getClusterDistance = useCallback(
		(zoomLevel: number) => {
			if (
				zoomLevel < minZoomForClustering ||
				zoomLevel > maxZoomForClustering
			) {
				return 0;
			}

			const factor = Math.max(
				0.1,
				(maxZoomForClustering - zoomLevel) /
					(maxZoomForClustering - minZoomForClustering),
			);
			return distance * factor;
		},
		[distance, minZoomForClustering, maxZoomForClustering],
	);

	useEffect(() => {
		// Don't create the layer until we have data and no errors
		if (!map || zIndex === null || !config || loading || error || !venuesData)
			return;

		const epsg = config.portalConfig.map.mapView.epsg;
		const currentZoom = map.getView().getZoom() || 6;

		const vectorSource = new VectorSource({
			features: new GeoJSON().readFeatures(transformGeoJSON(venuesData, epsg)),
		});

		const clusterSource = new Cluster({
			distance: getClusterDistance(currentZoom),
			source: vectorSource,
		});

		const vectorLayer = new VectorLayer({
			source: clusterSource,
			style: styleFunction,
		});

		const handleZoomChange = () => {
			let zoomLevel = map.getView().getZoom() ?? 6;

			// Clamp any negative zoom to 0
			if (zoomLevel < 0) {
				zoomLevel = 0;
			}

			const newDistance = getClusterDistance(zoomLevel);
			clusterSource.setDistance(newDistance);
		};

		map.getView().on("change:resolution", handleZoomChange);

		map.addLayer(vectorLayer);
		vectorLayer.setZIndex(zIndex);
		vectorLayer.set("name", "venues");
		vectorLayer.set("id", "venues");

		return () => {
			if (map) {
				map.getView().un("change:resolution", handleZoomChange);
				map.removeLayer(vectorLayer);
			}
		};
	}, [map, zIndex, config, getClusterDistance, venuesData, loading, error]);

	// Optional: You could add loading/error UI here if needed
	if (loading) {
		console.log("Loading venues data...");
	}

	if (error) {
		console.error("Venues layer error:", error);
	}

	return null;
};

export default VenueLayer;
