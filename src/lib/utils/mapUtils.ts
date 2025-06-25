/* eslint-disable @typescript-eslint/no-explicit-any */
import appConfig from "@/config/config";
import { register } from "ol/proj/proj4";
import { fromLonLat } from "ol/proj";
import proj4 from "proj4";

if (appConfig) {
	appConfig.namedProjections.forEach((projection) => {
		proj4.defs(projection[1]);
	});
	register(proj4);
}
// eslint-disable-next-line max-params
export async function fetchWFSData(
	url: string,
	typeNames: string,
	outputFormat?: string,
	srsName?: string,
) {
	const wfsUrl = url;
	const params = new URLSearchParams({
		service: "WFS",
		version: "2.0.0",
		request: "GetFeature",
		typeNames: typeNames,
		outputFormat: outputFormat || "application/json",
		srsName: srsName || "urn:ogc:def:crs:EPSG::25833",
	});

	const response = await fetch(`${wfsUrl}?${params.toString()}`);

	if (!response.ok) {
		throw new Error("Failed to fetch WFS data");
	}

	const data = await response.json();
	return data;
}

/**
 * Convert coordinates from EPSG:25833 to EPSG:3857
 * @param {number} x - X coordinate (Easting in EPSG:25833)
 * @param {number} y - Y coordinate (Northing in EPSG:25833)
 * @returns {[number, number]} Transformed coordinates in EPSG:3857
 */
export function convertToWebMercator(x: number, y: number) {
	return proj4("EPSG:25833", "EPSG:3857", [x, y]);
}

function transformCoordinates(
	coordinates: any,
	targetProjection = "EPSG:3857",
) {
	return fromLonLat(coordinates, targetProjection);
}

/**
 * Transform a GeoJSON object from one projection to another.
 *
 * @param {any} geojson - The GeoJSON object to be transformed.
 * @return {void}
 */
export function transformGeoJSON(geojson: any, targetProjection = "EPSG:3857") {
	const transformed = JSON.parse(JSON.stringify(geojson)); // Deep copy

	function transformGeometry(geometry: any) {
		if (geometry.type === "Point") {
			geometry.coordinates = transformCoordinates(
				geometry.coordinates,
				targetProjection,
			);
		} else if (
			geometry.type === "LineString" ||
			geometry.type === "MultiPoint"
		) {
			geometry.coordinates = geometry.coordinates.map(transformCoordinates);
		} else if (
			geometry.type === "Polygon" ||
			geometry.type === "MultiLineString"
		) {
			geometry.coordinates = geometry.coordinates.map((ring: any) =>
				ring.map(transformCoordinates),
			);
		} else if (geometry.type === "MultiPolygon") {
			geometry.coordinates = geometry.coordinates.map((polygon: any) =>
				polygon.map((ring: any) => ring.map(transformCoordinates)),
			);
		}
	}

	if (transformed.type === "Feature") {
		transformGeometry(transformed.geometry);
	} else if (transformed.type === "FeatureCollection") {
		transformed.features.forEach((feature: any) =>
			transformGeometry(feature.geometry),
		);
	}

	return transformed;
}
