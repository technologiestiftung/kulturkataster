/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useMapStore } from "@/lib/store/mapStore";
import { transformGeoJSON } from "@/lib/utils/mapUtils";
import { MapStoreState } from "@/types/map";

import { CategoryType } from "@/types";
import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { Coordinate } from "ol/coordinate";
import Feature, { FeatureLike } from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import { Vector as VectorSource } from "ol/source";
import Cluster from "ol/source/Cluster";
import { getDistance } from "ol/sphere";
import { Fill, Icon, Style, Text } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { FC, useCallback, useEffect, useRef } from "react";
import { createPoiSvg } from "../MapStyles/createPoiSvg";

interface InstitutionLayerProps {
	zIndex?: number;
	distance?: number;
	minZoomForClustering?: number;
	maxZoomForClustering?: number;
	institutionsData: FeatureCollection<Geometry, GeoJsonProperties> | null;
	proximityThreshold?: number;
}

const InstitutionLayer: FC<InstitutionLayerProps> = ({
	zIndex = 10000,
	distance = 150,
	minZoomForClustering = 0,
	maxZoomForClustering = 5,
	institutionsData,
	proximityThreshold = 50,
}) => {
	const map = useMapStore((state: MapStoreState) => state.map);
	const config = useMapStore((state) => state.config);
	const selectedInstitutionId = useInstitutionStore(
		(state) => state.selectedInstitutionId,
	);

	const vectorLayerRef = useRef<VectorLayer<any> | null>(null);
	const vectorSourceRef = useRef<VectorSource | null>(null);
	const offsetVectorSourceRef = useRef<VectorSource | null>(null);
	const clusterSourceRef = useRef<Cluster | null>(null);
	const originalFeaturesRef = useRef<Feature[] | null>(null);

	const getCategoryKey = useCallback(
		(feature: FeatureLike, features: any[]) => {
			if (features && features.length > 0) {
				return features[0]?.values_?.categories?.[0]?.key;
			}
			return feature.get("categories")?.[0]?.key;
		},
		[],
	);

	const getFeatureCoordinates = useCallback(
		(feature: Feature): Coordinate | null => {
			const geometry = feature.getGeometry();
			if (geometry && geometry.getType() === "Point") {
				return (geometry as Point).getCoordinates();
			}
			return null;
		},
		[],
	);

	const calculateDistance = useCallback(
		(coord1: Coordinate, coord2: Coordinate): number => {
			return getDistance(coord1, coord2);
		},
		[],
	);

	const findNearbyFeatures = useCallback(
		(targetFeature: Feature, allFeatures: Feature[]): Feature[] => {
			const targetCoords = getFeatureCoordinates(targetFeature);
			if (!targetCoords) return [targetFeature];

			const nearby: Feature[] = [];

			allFeatures.forEach((feature) => {
				const coords = getFeatureCoordinates(feature);
				if (
					coords &&
					calculateDistance(targetCoords, coords) <= proximityThreshold
				) {
					nearby.push(feature);
				}
			});
			return nearby.length > 0 ? nearby : [targetFeature];
		},
		[getFeatureCoordinates, calculateDistance, proximityThreshold],
	);

	const groupFeaturesByProximity = useCallback(
		(features: Feature[]): Feature[][] => {
			const processed = new Set<Feature>();
			const groups: Feature[][] = [];

			features.forEach((feature) => {
				if (processed.has(feature)) return;

				const nearbyFeatures = findNearbyFeatures(feature, features);
				nearbyFeatures.forEach((f) => processed.add(f));
				groups.push(nearbyFeatures);
			});

			return groups;
		},
		[findNearbyFeatures],
	);

	const createOffsetFeatures = useCallback(
		(features: Feature[]): Feature[] => {
			const proximityGroups = groupFeaturesByProximity(features);
			const offsetFeatures: Feature[] = [];

			proximityGroups.forEach((group) => {
				if (group.length === 1) {
					offsetFeatures.push(group[0].clone());
				} else {
					const offsetRadius = Math.max(
						10,
						Math.min(50, proximityThreshold * 0.8),
					);
					const angleStep = (2 * Math.PI) / group.length;

					group.forEach((feature, index) => {
						const clonedFeature = feature.clone();
						const geometry = clonedFeature.getGeometry();

						if (geometry && geometry.getType() === "Point") {
							const coords = (geometry as Point).getCoordinates() as Coordinate;

							if (index === 0) {
								offsetFeatures.push(clonedFeature);
							} else {
								const angle = angleStep * index;
								const offsetX = Math.cos(angle) * offsetRadius;
								const offsetY = Math.sin(angle) * offsetRadius;

								const newCoords: Coordinate = [
									coords[0] + offsetX,
									coords[1] + offsetY,
								];
								(geometry as Point).setCoordinates(newCoords);
								offsetFeatures.push(clonedFeature);
							}
						}
					});
				}
			});

			return offsetFeatures;
		},
		[groupFeaturesByProximity, proximityThreshold],
	);

	const hasNearbyFeatures = useCallback(
		(targetFeature: Feature, allFeatures: Feature[]): boolean => {
			const targetCoords = getFeatureCoordinates(targetFeature);
			if (!targetCoords) return false;

			return allFeatures.some((feature) => {
				if (feature === targetFeature) return false;
				const coords = getFeatureCoordinates(feature);
				return (
					coords &&
					calculateDistance(targetCoords, coords) <= proximityThreshold
				);
			});
		},
		[getFeatureCoordinates, calculateDistance, proximityThreshold],
	);

	const createSingleFeatureStyle = useCallback(
		(categoryKey: CategoryType, isSelected = false, hasOverlapping = false) => {
			const fillColor = isSelected ? "#AAE9C9" : "#D9C1FF";
			const iconSvg = createPoiSvg(categoryKey, fillColor, "#161616");
			return new Style({
				image: new Icon({
					anchor: [0.5, 1],
					src: iconSvg,
					offset: [0, 0],
					opacity: 1,
					scale: hasOverlapping ? 0.9 : 1,
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

	const shouldCluster = useCallback(
		(zoomLevel: number) => {
			return (
				zoomLevel >= minZoomForClustering && zoomLevel <= maxZoomForClustering
			);
		},
		[minZoomForClustering, maxZoomForClustering],
	);

	const styleFunction = useCallback(
		// eslint-disable-next-line complexity
		function (feature: FeatureLike) {
			const features = feature.get("features");
			const size = features ? features.length : 1;

			if (size === 1) {
				const categoryKey = getCategoryKey(feature, features);
				const featureToCheck = features ? features[0] : feature;
				const featureId =
					featureToCheck?.get?.("id") || featureToCheck?.values_?.id;

				const currentSelectedId =
					useInstitutionStore.getState().selectedInstitutionId;
				const isSelected = featureId === currentSelectedId;

				const currentZoom = map?.getView().getZoom() || 6;
				const clustering = shouldCluster(currentZoom);
				let hasOverlapping = false;

				if (!clustering && originalFeaturesRef.current) {
					hasOverlapping = hasNearbyFeatures(
						featureToCheck,
						originalFeaturesRef.current,
					);
				}

				return createSingleFeatureStyle(
					categoryKey,
					isSelected,
					hasOverlapping,
				);
			}
			return createClusterStyle(size);
		},
		[
			createClusterStyle,
			getCategoryKey,
			map,
			shouldCluster,
			createSingleFeatureStyle,
			hasNearbyFeatures,
		],
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
			if (
				!map ||
				!vectorSourceRef.current ||
				!vectorLayerRef.current ||
				!offsetVectorSourceRef.current
			)
				return;

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
				vectorLayerRef.current.setSource(offsetVectorSourceRef.current);
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
		if (!map || zIndex === null || !config || !institutionsData) return;

		const epsg = config.portalConfig.map.mapView.epsg;
		const currentZoom = map.getView().getZoom() || 6;

		const originalFeatures = new GeoJSON().readFeatures(
			transformGeoJSON(institutionsData, epsg),
		);
		originalFeaturesRef.current = originalFeatures;

		const vectorSource = new VectorSource({
			features: originalFeatures,
		});
		vectorSourceRef.current = vectorSource;

		const offsetFeatures = createOffsetFeatures(originalFeatures);
		const offsetVectorSource = new VectorSource({
			features: offsetFeatures,
		});
		offsetVectorSourceRef.current = offsetVectorSource;

		const clusterSource = new Cluster({
			distance: getClusterDistance(currentZoom),
			source: vectorSource,
		});
		clusterSourceRef.current = clusterSource;

		const initialSource = shouldCluster(currentZoom)
			? clusterSource
			: offsetVectorSource;

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
		vectorLayer.set("name", "institutions");
		vectorLayer.set("id", "institutions");

		return () => {
			if (map && vectorLayerRef.current) {
				map.getView().un("change:resolution", handleZoomChange);
				map.un("click", handleClusterClick);
				map.removeLayer(vectorLayerRef.current);
			}
			vectorLayerRef.current = null;
			vectorSourceRef.current = null;
			offsetVectorSourceRef.current = null;
			clusterSourceRef.current = null;
			originalFeaturesRef.current = null;
		};
	}, [
		map,
		zIndex,
		config,
		getClusterDistance,
		shouldCluster,
		updateLayerSource,
		styleFunction,
		institutionsData,
		handleClusterClick,
		createOffsetFeatures,
	]);

	useEffect(() => {
		if (vectorLayerRef.current) {
			const source = vectorLayerRef.current.getSource();
			if (source) {
				source.changed();
			}
		}
	}, [selectedInstitutionId]);

	return null;
};

export default InstitutionLayer;
