/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { useVenueStore } from "@/lib/store/venueStore";
import { getVenuesGeoJSON } from "@/lib/supabase/api";
import { transformGeoJSON } from "@/lib/utils/mapUtils";
import { CategoryType } from "@/types";
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
	distance = 150,
	minZoomForClustering = 0,
	maxZoomForClustering = 4,
}) => {
	const map = useMapStore((state: MapStoreState) => state.map);
	const config = useMapStore((state) => state.config);
	const selectedVenueId = useVenueStore((state) => state.selectedVenueId);
	const [venuesData, setVenuesData] = useState<FeatureCollection<
		Geometry,
		GeoJsonProperties
	> | null>(null);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const vectorLayerRef = useRef<VectorLayer<any> | null>(null);
	const vectorSourceRef = useRef<VectorSource | null>(null);
	const clusterSourceRef = useRef<Cluster | null>(null);

	useEffect(() => {
		const fetchVenues = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await getVenuesGeoJSON();

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
				return features[0]?.values_?.categories?.[0]?.key;
			}
			return feature.get("categories")?.[0]?.key;
		},
		[],
	);

	const createSingleFeatureStyle = useCallback(
		(categoryKey: CategoryType, isSelected = false) => {
			const fillColor = isSelected ? "#AAE9C9" : "#D9C1FF";
			const iconSvg = createPoiSvg(categoryKey, fillColor, "#161616");
			return new Style({
				image: new Icon({
					anchor: [0.5, 1],
					src: iconSvg,
					offset: [0, 0],
					opacity: 1,
					scale: 1,
				}),
			});
		},
		[],
	);

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
			zIndex: 10,
		});
	}, []);

	const styleFunction = useCallback(
		function (feature: FeatureLike) {
			const features = feature.get("features");
			const size = features ? features.length : 1;

			if (size === 1) {
				const categoryKey = getCategoryKey(feature, features);
				const featureToCheck = features ? features[0] : feature;
				const featureId =
					featureToCheck?.get?.("id") || featureToCheck?.values_?.id;

				const currentSelectedId = useVenueStore.getState().selectedVenueId;
				const isSelected = featureId === currentSelectedId;

				return createSingleFeatureStyle(categoryKey, isSelected);
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
				vectorLayerRef.current.setSource(vectorSourceRef.current);
			}
		},
		[map, shouldCluster, getClusterDistance],
	);

	const handleClusterClick = useCallback(
		(event: any) => {
			if (!map || !vectorLayerRef.current) return;

			const features = map.getFeaturesAtPixel(event.pixel, {
				layerFilter: (layer) => layer === vectorLayerRef.current,
			});

			if (features.length > 0) {
				const feature = features[0];
				const clusteredFeatures = feature.get("features");

				if (clusteredFeatures && clusteredFeatures.length > 1) {
					event.preventDefault();
					event.stopPropagation();

					const extent = clusteredFeatures.reduce(
						(acc: any, clusterFeature: any) => {
							const geometry = clusterFeature.getGeometry();
							if (geometry) {
								const featureExtent = geometry.getExtent();
								if (acc) {
									return [
										Math.min(acc[0], featureExtent[0]),
										Math.min(acc[1], featureExtent[1]),
										Math.max(acc[2], featureExtent[2]),
										Math.max(acc[3], featureExtent[3]),
									];
								}
								return featureExtent;
							}
							return acc;
						},
						null,
					);

					if (extent) {
						map.getView().fit(extent, {
							padding: [50, 50, 50, 50],
							duration: 500,
							maxZoom: Math.max(maxZoomForClustering + 1, 10),
						});
					}
				}
			}
		},
		[map, maxZoomForClustering],
	);

	useEffect(() => {
		if (!map || zIndex === null || !config || loading || error || !venuesData)
			return;

		const epsg = config.portalConfig.map.mapView.epsg;
		const currentZoom = map.getView().getZoom() || 6;

		const vectorSource = new VectorSource({
			features: new GeoJSON().readFeatures(transformGeoJSON(venuesData, epsg)),
		});
		vectorSourceRef.current = vectorSource;

		const clusterSource = new Cluster({
			distance: getClusterDistance(currentZoom),
			source: vectorSource,
		});
		clusterSourceRef.current = clusterSource;

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

			if (zoomLevel < 0) {
				zoomLevel = 0;
			}

			updateLayerSource(zoomLevel);
		};

		map.getView().on("change:resolution", handleZoomChange);
		map.on("click", handleClusterClick);

		map.addLayer(vectorLayer);
		vectorLayer.setZIndex(zIndex);
		vectorLayer.set("name", "venues");
		vectorLayer.set("id", "venues");

		return () => {
			if (map && vectorLayerRef.current) {
				map.getView().un("change:resolution", handleZoomChange);
				map.un("click", handleClusterClick);
				map.removeLayer(vectorLayerRef.current);
			}
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
		handleClusterClick,
	]);

	useEffect(() => {
		if (vectorLayerRef.current) {
			const source = vectorLayerRef.current.getSource();
			if (source) {
				source.changed();
			}
		}
	}, [selectedVenueId]);

	if (loading) {
		console.log("Loading venues data...");
	}

	if (error) {
		console.error("Venues layer error:", error);
	}

	return null;
};

export default VenueLayer;
