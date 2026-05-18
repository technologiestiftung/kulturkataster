/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-params */
/* eslint-disable no-nested-ternary */
"use client";

import { useMapStore } from "@/lib/store/mapStore";
import {
	getTailwindColor,
	remToPx,
	transformGeoJSON,
} from "@/lib/utils/mapUtils";
import { CategoryType } from "@/types";
import { MapStoreState } from "@/types/map";
import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import Feature, { FeatureLike } from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import { Vector as VectorSource } from "ol/source";
import Cluster from "ol/source/Cluster";
import { Fill, Icon, Style, Text } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { FC, useCallback, useEffect, useMemo, useRef } from "react";
import { createPoiSvg } from "../MapStyles/createPoiSvg";
import { useAppStore } from "@/lib/store/appStore";
import { usePathname } from "next/navigation";
import { createPoiIconResolver } from "@/lib/utils/poiIconResolver";
import { getCategoryIconFetchCandidates } from "@/server/actions/categoryIcons";

const styleCache: { [key: string]: Style } = {};
const svgCache: { [key: string]: string } = {};
const createCachedPoiSvg = (
	iconKey: string,
	iconVersion: number,
	iconRawSvg: string,
	fillColor: string,
	strokeColor: string,
	isPermanentlyClosed: boolean,
	isContrastMode: boolean,
	isLargeTextMode: boolean,
	state: string,
): string => {
	const cacheKey = `${iconKey}_${iconVersion}_${fillColor}_${strokeColor}_${isPermanentlyClosed}_${isContrastMode}_${isLargeTextMode}_${state}`;
	if (!svgCache[cacheKey]) {
		svgCache[cacheKey] = createPoiSvg(
			iconRawSvg,
			fillColor,
			strokeColor,
			state,
		);
	}
	return svgCache[cacheKey];
};

const fillColors = {
	selected: {
		contrast: "brand-default",
		normal: "brand-default",
	},
	closed: {
		contrast: "neutral-80",
		normal: "neutral-80",
	},
	default: {
		contrast: "interaction-default",
		normal: "interaction-default",
	},
} as const;

const strokeColors = {
	closed: "white",
	default: "black",
} as const;

interface InstitutionLayerProps {
	zIndex?: number;
	distance?: number;
	minZoomForClustering?: number;
	maxZoomForClustering?: number;
	institutions: FeatureCollection<Geometry, GeoJsonProperties> | null;
	proximityThreshold?: number;
}

const InstitutionLayer: FC<InstitutionLayerProps> = ({
	zIndex = 10000,
	distance = 200,
	minZoomForClustering = 0,
	maxZoomForClustering = 6,
	institutions,
	proximityThreshold = 40,
}) => {
	const fixedProximityThreshold = remToPx(3.5);
	const map = useMapStore((state: MapStoreState) => state.map);
	const config = useMapStore((state) => state.config);
	const pathname = usePathname();
	const selectedInstitutionId = useMemo(() => {
		const normalizedPath = pathname?.replace(/\/$/, "");
		if (!normalizedPath) return null;
		const match = normalizedPath.match(/\/institution\/(\d+)$/);
		if (!match) return null;
		const parsedId = Number(match[1]);
		return Number.isNaN(parsedId) ? null : parsedId;
	}, [pathname]);

	const vectorLayerRef = useRef<VectorLayer<any> | null>(null);
	const vectorSourceRef = useRef<VectorSource | null>(null);
	const offsetVectorSourceRef = useRef<VectorSource | null>(null);
	const clusterSourceRef = useRef<Cluster | null>(null);
	const iconResolverRef = useRef(
		createPoiIconResolver({
			getFetchCandidates: getCategoryIconFetchCandidates,
			onIconResolved: () => {
				vectorLayerRef.current?.changed();
			},
		}),
	);

	const { isContrastMode, isLargeTextMode } = useAppStore();

	const processFeaturesForDecluttering = useCallback(
		(features: Feature[]): Feature[] => {
			const tempSource = new VectorSource({ features });
			const processedFeatureIds = new Set<string | number>();
			const proximityGroups: Feature[][] = [];

			features.forEach((feature) => {
				const featureId = feature.getId();
				if (!featureId || processedFeatureIds.has(featureId)) return;
				const geometry = feature.getGeometry() as Point;
				if (!geometry) return;

				const searchExtent = geometry.getExtent();
				searchExtent[0] -= proximityThreshold;
				searchExtent[1] -= proximityThreshold;
				searchExtent[2] += proximityThreshold;
				searchExtent[3] += proximityThreshold;
				const nearbyFeatures = tempSource.getFeaturesInExtent(searchExtent);

				const unprocessedNearbyFeatures = nearbyFeatures.filter((f) => {
					const id = f.getId();
					return id && !processedFeatureIds.has(id);
				});

				if (unprocessedNearbyFeatures.length > 0) {
					proximityGroups.push(unprocessedNearbyFeatures);
					unprocessedNearbyFeatures.forEach((f) => {
						const id = f.getId();
						if (id) processedFeatureIds.add(id);
					});
				}
			});

			const offsetFeatures: Feature[] = [];
			proximityGroups.forEach((group) => {
				const hasOverlapping = group.length > 1;
				if (!hasOverlapping) {
					const singleFeature = group[0].clone();
					singleFeature.set("has_overlapping", false);
					offsetFeatures.push(singleFeature);
				} else {
					const usedFixed = false;
					const offsetRadius = usedFixed
						? fixedProximityThreshold
						: Math.max(10, Math.min(50, proximityThreshold * 0.8));
					const angleStep = (2 * Math.PI) / group.length;
					const centerCoords = (
						group[0].getGeometry() as Point
					).getCoordinates();

					group.forEach((member, index) => {
						const clonedFeature = member.clone();
						clonedFeature.set("has_overlapping", true);
						const geom = clonedFeature.getGeometry() as Point;

						if (index > 0) {
							const angle = angleStep * index;
							const offsetX = Math.cos(angle) * offsetRadius;
							const offsetY = Math.sin(angle) * offsetRadius;
							geom.setCoordinates([
								centerCoords[0] + offsetX,
								centerCoords[1] + offsetY,
							]);
						} else {
							geom.setCoordinates(centerCoords);
						}
						offsetFeatures.push(clonedFeature);
					});
				}
			});
			return offsetFeatures;
		},
		[proximityThreshold],
	);

	const getCategoryVisual = useCallback((feature: FeatureLike) => {
		const categories = feature.get("categories");
		if (categories && categories.length > 1) {
			return {
				categoryKey: "multi_categories" as CategoryType,
				iconHref: null as string | null,
			};
		}
		const firstCategory = categories?.[0];
		const iconHref =
			typeof firstCategory?.icon === "string" &&
			firstCategory.icon.trim().length > 0
				? firstCategory.icon
				: null;
		return {
			categoryKey: (firstCategory?.key || "default") as CategoryType,
			iconHref,
		};
	}, []);

	const createSingleFeatureStyle = useCallback(
		(
			categoryKey: CategoryType,
			iconHref: string | null,
			isSelected = false,
			isPermanentlyClosed = false,
			hasOverlapping = false,
			downIsContrastMode = false,
		) => {
			const state = isSelected
				? "selected"
				: isPermanentlyClosed
					? "closed"
					: "default";

			const mode = downIsContrastMode ? "contrast" : "normal";
			const fillColor = getTailwindColor(fillColors[state][mode]);

			const strokeColor = getTailwindColor(
				strokeColors[isPermanentlyClosed ? "closed" : "default"],
			);
			const iconRawSvg = iconResolverRef.current.resolveIconRawSvg(
				iconHref,
				categoryKey,
			);
			const iconVersion = iconResolverRef.current.getIconVersion(iconHref);
			const iconKey = iconResolverRef.current.getIconKey(iconHref, categoryKey);

			const iconSvg = createCachedPoiSvg(
				iconKey,
				iconVersion,
				iconRawSvg,
				fillColor,
				strokeColor,
				isPermanentlyClosed,
				downIsContrastMode,
				isLargeTextMode,
				state,
			);
			return new Style({
				image: new Icon({
					anchor: [0.5, 1],
					src: iconSvg,
					scale: hasOverlapping ? 0.9 : 1,
				}),
			});
		},
		[isLargeTextMode],
	);

	const createClusterStyle = useCallback(
		(size: number, downIsContrastMode: boolean) => {
			return new Style({
				image: new CircleStyle({
					radius: remToPx(0.9375),
					fill: new Fill({ color: downIsContrastMode ? "#5617ba" : "#C288FF" }),
				}),
				text: new Text({
					text: size.toString(),
					font: `bold 0.75rem sans-serif`,
					fill: new Fill({ color: downIsContrastMode ? "#ffffff" : "#161616" }),
				}),
			});
		},
		[],
	);

	const styleFunction = useCallback(
		(feature: FeatureLike) => {
			const features = feature.get("features");
			const size = features ? features.length : 1;

			if (size > 1) {
				const clusterCacheKey = `cluster_${size}_${isContrastMode}_${isLargeTextMode}`;
				if (!styleCache[clusterCacheKey])
					styleCache[clusterCacheKey] = createClusterStyle(
						size,
						isContrastMode,
					);
				return styleCache[clusterCacheKey];
			}

			const singleFeature = features ? features[0] : feature;
			const isSelected =
				selectedInstitutionId !== null &&
				singleFeature.get("id") === selectedInstitutionId;
			const hasOverlapping = singleFeature.get("has_overlapping") === true;
			const isPermanentlyClosed =
				singleFeature.get("utilization_status") === "permanently_closed";
			const { categoryKey, iconHref } = getCategoryVisual(singleFeature);
			const iconVersion = iconResolverRef.current.getIconVersion(iconHref);
			const styleCacheKey = `${categoryKey}_${iconHref ?? "fallback"}_${iconVersion}_${isSelected}_${hasOverlapping}_${isPermanentlyClosed}_${isContrastMode}_${isLargeTextMode}`;

			if (!styleCache[styleCacheKey])
				styleCache[styleCacheKey] = createSingleFeatureStyle(
					categoryKey,
					iconHref,
					isSelected,
					isPermanentlyClosed,
					hasOverlapping,
					isContrastMode,
				);

			return styleCache[styleCacheKey];
		},
		[
			createClusterStyle,
			getCategoryVisual,
			createSingleFeatureStyle,
			isContrastMode,
			isLargeTextMode,
			selectedInstitutionId,
		],
	);

	const shouldCluster = useCallback(
		(zoomLevel: number) =>
			zoomLevel >= minZoomForClustering && zoomLevel <= maxZoomForClustering,
		[minZoomForClustering, maxZoomForClustering],
	);

	const getClusterDistance = useCallback(
		(zoomLevel: number) => {
			if (!shouldCluster(zoomLevel)) return 0;
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
				!vectorLayerRef.current ||
				!clusterSourceRef.current ||
				!offsetVectorSourceRef.current
			)
				return;
			const clustering = shouldCluster(zoomLevel);
			if (clustering) {
				clusterSourceRef.current.setDistance(getClusterDistance(zoomLevel));
				vectorLayerRef.current.setSource(clusterSourceRef.current);
			} else {
				vectorLayerRef.current.setSource(offsetVectorSourceRef.current);
			}
		},
		[shouldCluster, getClusterDistance],
	);

	const handleClusterClick = useCallback(
		(event: any) => {
			if (!map || !vectorLayerRef.current) return;

			const features = map.getFeaturesAtPixel(event.pixel, {
				layerFilter: (layer) => layer === vectorLayerRef.current,
			});

			if (features.length > 0) {
				const clusteredFeatures = features[0].get("features");

				if (clusteredFeatures && clusteredFeatures.length > 1) {
					event.preventDefault();
					event.stopPropagation();

					const extent = clusteredFeatures[0]
						.getGeometry()
						.getExtent()
						.slice(0);

					clusteredFeatures.forEach((feature: Feature) => {
						const featureExtent = feature.getGeometry()!.getExtent();
						extent[0] = Math.min(extent[0], featureExtent[0]);
						extent[1] = Math.min(extent[1], featureExtent[1]);
						extent[2] = Math.max(extent[2], featureExtent[2]);
						extent[3] = Math.max(extent[3], featureExtent[3]);
					});

					map.getView().fit(extent, {
						padding: [50, 50, 50, 50],
						duration: 500,
						maxZoom: map.getView().getMaxZoom() - 1,
					});
				}
			}
		},
		[map],
	);

	useEffect(() => {
		if (!map) return;

		const vectorSource = new VectorSource();
		vectorSourceRef.current = vectorSource;
		const offsetVectorSource = new VectorSource();
		offsetVectorSourceRef.current = offsetVectorSource;
		const clusterSource = new Cluster({ source: vectorSource, distance });
		clusterSourceRef.current = clusterSource;

		const vectorLayer = new VectorLayer({
			source: clusterSource,
			style: styleFunction,
			declutter: true,
			renderBuffer: 200,
		});

		vectorLayerRef.current = vectorLayer;

		map.addLayer(vectorLayer);

		vectorLayer.setZIndex(zIndex);
		vectorLayer.set("name", "institutions");
		vectorLayer.set("id", "institutions");

		const handleZoomChange = () =>
			updateLayerSource(map.getView().getZoom() ?? 6);

		map.getView().on("change:resolution", handleZoomChange);

		map.on("click", handleClusterClick);

		return () => {
			if (map && vectorLayer) {
				map.removeLayer(vectorLayer);
				map.getView().un("change:resolution", handleZoomChange);
				map.un("click", handleClusterClick);
			}
		};
	}, [map, updateLayerSource, handleClusterClick, zIndex, distance]);

	useEffect(() => {
		if (
			!map ||
			!vectorSourceRef.current ||
			!offsetVectorSourceRef.current ||
			!institutions ||
			!config
		)
			return;

		const epsg = config.portalConfig.map.mapView.epsg;

		const features = new GeoJSON().readFeatures(
			transformGeoJSON(institutions, epsg),
		);

		features.forEach((f, i) => {
			if (!f.getId()) f.setId(f.get("id") || `institution-${i}`);
		});

		const offsetFeatures = processFeaturesForDecluttering(features);
		vectorSourceRef.current.clear();
		vectorSourceRef.current.addFeatures(features);
		offsetVectorSourceRef.current.clear();
		offsetVectorSourceRef.current.addFeatures(offsetFeatures);

		updateLayerSource(map.getView().getZoom() ?? 6);
	}, [
		institutions,
		config,
		map,
		updateLayerSource,
		processFeaturesForDecluttering,
	]);

	useEffect(() => {
		vectorLayerRef.current?.getSource()?.changed();
	}, [selectedInstitutionId]);

	useEffect(() => {
		if (!vectorLayerRef.current) return;
		vectorLayerRef.current.setStyle(styleFunction);
		vectorLayerRef.current.changed();
	}, [styleFunction]);

	useEffect(() => {
		Object.keys(styleCache).forEach((k) => delete styleCache[k]);
		Object.keys(svgCache).forEach((k) => delete svgCache[k]);
	}, [isContrastMode, isLargeTextMode]);

	return null;
};

export default InstitutionLayer;
