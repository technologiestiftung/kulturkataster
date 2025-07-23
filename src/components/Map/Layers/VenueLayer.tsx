/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { getInstitutionsGeoJSON } from "@/lib/supabase/api";
import { CategoryType } from "@/lib/utils/iconUtils";
import { transformGeoJSON } from "@/lib/utils/mapUtils";
import { MapStoreState } from "@/types/map";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { FeatureLike } from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import { Vector as VectorSource } from "ol/source";
import Cluster from "ol/source/Cluster";
import { Fill, Icon, Style, Text } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { createPoiSvg } from "../MapStyles/createPoiSvg";

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

	// Use refs to track the current layer and sources
	const vectorLayerRef = useRef<VectorLayer<any> | null>(null);
	const vectorSourceRef = useRef<VectorSource | null>(null);
	const clusterSourceRef = useRef<Cluster | null>(null);

	// Fetch venues data on component mount
	useEffect(() => {
		const fetchVenues = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await getInstitutionsGeoJSON();

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

	const getCategoryKey = useCallback(
		(feature: FeatureLike, features: any[]) => {
			if (features && features.length > 0) {
				// Clustered feature (even if cluster size is 1)
				return features[0]?.values_?.categories?.[0]?.key;
			}
			// Individual feature (no clustering)
			return feature.get("categories")?.[0]?.key;
		},
		[],
	);

	const createSingleFeatureStyle = useCallback((categoryKey: CategoryType) => {
		const iconSvg = createPoiSvg(categoryKey, "#C288FF", "#161616");
		return new Style({
			image: new Icon({
				anchor: [0.5, 1],
				src: iconSvg,
				offset: [0, 0],
				opacity: 1,
				scale: 1,
			}),
		});
	}, []);

	const createClusterStyle = useCallback((size: number) => {
		const radius = 15;
		const color = "#C288FF";
		const textColor = "#161616";

		return new Style({
			image: new CircleStyle({
				radius,
				fill: new Fill({ color }),
			}),
			text: new Text({
				text: size.toString(),
				font: `bold ${Math.min(radius * 1, 12)}px sans-serif`,
				fill: new Fill({ color: textColor }),
				offsetY: 0,
			}),
		});
	}, []);

	const styleFunction = useCallback(
		function (feature: FeatureLike) {
			const features = feature.get("features");
			const size = features ? features.length : 1;

			if (size === 1) {
				const categoryKey = getCategoryKey(feature, features);
				return createSingleFeatureStyle(categoryKey);
			}
			return createClusterStyle(size);
		},
		[getCategoryKey, createSingleFeatureStyle, createClusterStyle],
	);

	const shouldCluster = useCallback(
		(zoomLevel: number) => {
			return (
				zoomLevel >= minZoomForClustering && zoomLevel <= maxZoomForClustering
			);
		},
		[minZoomForClustering, maxZoomForClustering],
	);

	const getClusterDistance = useCallback(
		(zoomLevel: number) => {
			if (!shouldCluster(zoomLevel)) {
				return 0;
			}

			const factor = Math.max(
				0.1,
				(maxZoomForClustering - zoomLevel) /
					(maxZoomForClustering - minZoomForClustering),
			);
			return distance * factor;
		},
		[distance, minZoomForClustering, maxZoomForClustering, shouldCluster],
	);

	const updateLayerSource = useCallback(
		(zoomLevel: number) => {
			if (!map || !vectorSourceRef.current || !vectorLayerRef.current) return;

			const clustering = shouldCluster(zoomLevel);

			if (clustering) {
				// Use clustering
				if (!clusterSourceRef.current) {
					clusterSourceRef.current = new Cluster({
						distance: getClusterDistance(zoomLevel),
						source: vectorSourceRef.current,
					});
				} else {
					clusterSourceRef.current.setDistance(getClusterDistance(zoomLevel));
				}
				vectorLayerRef.current.setSource(clusterSourceRef.current);
			} else {
				// Use original source without clustering
				vectorLayerRef.current.setSource(vectorSourceRef.current);
			}
		},
		[map, shouldCluster, getClusterDistance],
	);

	useEffect(() => {
		// Don't create the layer until we have data and no errors
		if (!map || zIndex === null || !config || loading || error || !venuesData)
			return;

		const epsg = config.portalConfig.map.mapView.epsg;
		const currentZoom = map.getView().getZoom() || 6;

		// Create the base vector source
		const vectorSource = new VectorSource({
			features: new GeoJSON().readFeatures(transformGeoJSON(venuesData, epsg)),
		});
		vectorSourceRef.current = vectorSource;

		// Create cluster source
		const clusterSource = new Cluster({
			distance: getClusterDistance(currentZoom),
			source: vectorSource,
		});
		clusterSourceRef.current = clusterSource;

		// Create the layer with appropriate initial source
		const initialSource = shouldCluster(currentZoom)
			? clusterSource
			: vectorSource;
		const vectorLayer = new VectorLayer({
			source: initialSource,
			style: styleFunction,
		});
		vectorLayerRef.current = vectorLayer;

		const handleZoomChange = () => {
			let zoomLevel = map.getView().getZoom() ?? 6;

			// Clamp any negative zoom to 0
			if (zoomLevel < 0) {
				zoomLevel = 0;
			}

			updateLayerSource(zoomLevel);
		};

		map.getView().on("change:resolution", handleZoomChange);

		map.addLayer(vectorLayer);
		vectorLayer.setZIndex(zIndex);
		vectorLayer.set("name", "venues");
		vectorLayer.set("id", "venues");

		return () => {
			if (map && vectorLayerRef.current) {
				map.getView().un("change:resolution", handleZoomChange);
				map.removeLayer(vectorLayerRef.current);
			}
			// Clean up refs
			vectorLayerRef.current = null;
			vectorSourceRef.current = null;
			clusterSourceRef.current = null;
		};
	}, [
		map,
		zIndex,
		config,
		getClusterDistance,
		shouldCluster,
		updateLayerSource,
		styleFunction,
		venuesData,
		loading,
		error,
	]);

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
