/* eslint-disable @typescript-eslint/no-explicit-any */
import { fromLonLat } from "ol/proj";
import proj4 from "proj4";

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

// Define projections
proj4.defs("EPSG:25833", "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs");
proj4.defs(
	"EPSG:3857",
	"+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
);

/**
 * Convert coordinates from EPSG:25833 to EPSG:3857
 * @param {number} x - X coordinate (Easting in EPSG:25833)
 * @param {number} y - Y coordinate (Northing in EPSG:25833)
 * @returns {[number, number]} Transformed coordinates in EPSG:3857
 */
export function convertToWebMercator(x: number, y: number) {
	return proj4("EPSG:25833", "EPSG:3857", [x, y]);
}

const targetProjection = "EPSG:25833"; // ETRS89 / UTM zone 33N

function transformCoordinates(coordinates: any) {
	return fromLonLat(coordinates, targetProjection);
}

/**
 * Transform a GeoJSON object from one projection to another.
 *
 * @param {any} geojson - The GeoJSON object to be transformed.
 * @return {void}
 */
export function transformGeoJSON(geojson: any) {
	const transformed = JSON.parse(JSON.stringify(geojson)); // Deep copy

	function transformGeometry(geometry: any) {
		if (geometry.type === "Point") {
			geometry.coordinates = transformCoordinates(geometry.coordinates);
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
