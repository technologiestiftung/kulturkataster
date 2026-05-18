"use client";

import appConfig from "@/config/config";
import Map from "ol/Map";
import View from "ol/View";
import { transform } from "ol/proj";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import React, { FC, useEffect, useRef } from "react";
import "../../../../node_modules/ol/ol.css";
import { useMapStore } from "../../../lib/store/mapStore";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";
import { useIsMobile } from "@/hooks/use-mobile";

const INITIAL_DESKTOP_PANEL_WIDTH_VAR = "--sidebar-width";
const INITIAL_DESKTOP_CENTER_SHIFT_RATIO = 0.5;
const INITIAL_ZOOM_LEVEL_OFFSET = 1;

const getCssPixelValue = (cssVariableName: string): number => {
	if (typeof window === "undefined") return 0;

	const rootStyles = getComputedStyle(document.documentElement);
	const rawValue = rootStyles.getPropertyValue(cssVariableName).trim();
	if (!rawValue) return 0;

	if (rawValue.endsWith("rem")) {
		const fontSize = parseFloat(rootStyles.fontSize);
		const remValue = parseFloat(rawValue);
		return Number.isFinite(fontSize) && Number.isFinite(remValue)
			? remValue * fontSize
			: 0;
	}

	if (rawValue.endsWith("px")) {
		const pxValue = parseFloat(rawValue);
		return Number.isFinite(pxValue) ? pxValue : 0;
	}

	const numericValue = Number(rawValue);
	return Number.isFinite(numericValue) ? numericValue : 0;
};

if (appConfig?.namedProjections?.length) {
	appConfig.namedProjections.forEach(([name, def]) => {
		proj4.defs(name, def);
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	register(proj4 as unknown as any);
}

interface OlMapProps {
	children?: React.ReactNode;
}

const OlMap: FC<OlMapProps> = ({ children }) => {
	const setMap = useMapStore((state) => state.populateMap);
	const destroyMap = useMapStore((state) => state.removeMap);
	const config = useMapStore((state) => state.config);
	const mapId = useRef<HTMLDivElement>(null);
	const isMobile = useIsMobile();

	useEffect(() => {
		if (!config) return;

		const mapViewConfig = config.portalConfig.map.mapView;

		const projection = mapViewConfig.epsg;
		let center = mapViewConfig.startCenter;

		if (
			center.length === 2 &&
			Math.abs(center[0]) <= 180 &&
			Math.abs(center[1]) <= 90
		) {
			center = transform(center, "EPSG:4326", projection);
		} else if (projection !== "EPSG:25833") {
		}

		const resolutions = [...mapViewConfig.options]
			.sort((a, b) => a.zoomLevel - b.zoomLevel)
			.map((option) => option.resolution);

		const requestedStartZoomLevel = Math.max(
			0,
			mapViewConfig.startZoomLevel - INITIAL_ZOOM_LEVEL_OFFSET,
		);
		const startZoomLevel = Math.max(
			0,
			Math.min(requestedStartZoomLevel, resolutions.length - 1),
		);
		if (startZoomLevel !== requestedStartZoomLevel) {
			reportClientTelemetry({
				level: "warn",
				event: "map.ol_map.start_zoom.out_of_range",
				metadata: {
					requested_zoom_level: requestedStartZoomLevel,
					applied_zoom_level: startZoomLevel,
				},
			});
		}

		if (!mapId.current) {
			reportClientTelemetry({
				level: "error",
				event: "map.ol_map.target.missing",
			});
			return;
		}

		try {
			const map = new Map({
				target: mapId.current,
				view: new View({
					center: center,
					zoom: startZoomLevel,
					projection: projection,
					smoothResolutionConstraint: false,
					constrainResolution: true,
					extent: mapViewConfig.extent,
					resolutions: resolutions,
					minZoom: 0,
					maxZoom: resolutions.length - 1,
				}),
			});

			const applyInitialDesktopOffset = () => {
				if (isMobile) return;

				const mapSize = map.getSize();
				if (!mapSize) return;

				const sidePanelWidth = getCssPixelValue(
					INITIAL_DESKTOP_PANEL_WIDTH_VAR,
				);
				if (sidePanelWidth <= 0) return;

				const shiftedCenter = map.getCoordinateFromPixel([
					mapSize[0] / 2 - sidePanelWidth * INITIAL_DESKTOP_CENTER_SHIFT_RATIO,
					mapSize[1] / 2,
				]);
				if (!shiftedCenter) return;

				map.getView().setCenter(shiftedCenter);
			};

			requestAnimationFrame(() => {
				map.updateSize();
				applyInitialDesktopOffset();
			});

			setMap(map);

			return () => {
				if (map) {
					map.setTarget(undefined);
				}
				destroyMap();
			};
		} catch (error) {
			reportClientTelemetry({
				level: "error",
				event: "map.ol_map.init.failed",
				error,
			});
		}
	}, [config, destroyMap, isMobile, setMap]);

	return (
		<div ref={mapId} className="map w-full h-full bg-slate-300">
			{children}
		</div>
	);
};

export default OlMap;
