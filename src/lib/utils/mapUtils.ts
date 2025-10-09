/* eslint-disable @typescript-eslint/no-explicit-any */
import { fromLonLat } from "ol/proj";
import { Map } from "ol";
import { Coordinate } from "ol/coordinate";

function transformCoordinates(
	coordinates: any,
	targetProjection = "EPSG:3857",
) {
	return fromLonLat(coordinates, targetProjection);
}

/**
 * Transform a GeoJSON object from one projection to another.
 * @param {any} geojson - The GeoJSON object to be transformed.
 * @return {void}
 */
export function transformGeoJSON(geojson: any, targetProjection = "EPSG:3857") {
	const transformed = JSON.parse(JSON.stringify(geojson)); // Deep copy

	function transformGeometry(geometry: any) {
		if (!geometry) {
			return;
		}

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

export function getEpsgFromCrs(crs: string) {
	const epsgMatch = crs.match(/EPSG[:/](\d+)/i);
	return epsgMatch ? `EPSG:${epsgMatch[1]}` : crs;
}

// Animation constants
export const ANIMATION_DURATION = 1000;
export const DEFAULT_ZOOM = 8;

/**
 * Parses POINT(lng lat) format coordinates from PostGIS
 */
export const parseLatLongCoordinates = (
	latlong: string,
): [number, number] | null => {
	const match = latlong.toString().match(/POINT\(([^ ]+) ([^ ]+)\)/);
	if (match) {
		const [, lng, lat] = match;
		return [parseFloat(lng), parseFloat(lat)];
	}
	return null;
};

/**
 * Parses coordinates in (lat,lng) format for LocationSearch
 * Returns already transformed coordinates for OpenLayers
 */
export const parseSearchLatLongCoordinates = (
	latlong: string,
): [number, number] | null => {
	const match = latlong.match(/\(([^,]+),([^)]+)\)/);
	if (!match) return null;

	const lat = parseFloat(match[1]);
	const lng = parseFloat(match[2]);
	if (isNaN(lat) || isNaN(lng)) return null;

	const coords = fromLonLat([lng, lat]);
	return coords as [number, number];
};

/**
 * Parses coordinates in (lat,lng) format
 */
export const parseCaseCoordinates = (
	caseField: string,
): [number, number] | null => {
	const match = caseField.match(/\(([^,]+),([^)]+)\)/);
	if (!match) return null;

	const lat = parseFloat(match[1]); // latitude first
	const lng = parseFloat(match[2]); // longitude second
	if (isNaN(lat) || isNaN(lng)) return null;

	// Transform from WGS84 (lat,lng) to map projection
	const coords = fromLonLat([lng, lat]);
	return coords as [number, number];
};

/**
 * Parses GeoJSON coordinates from st_asgeojson field
 */
export const parseGeoJsonCoordinates = (
	st_asgeojson: string,
): [number, number] | null => {
	try {
		const geoJson = JSON.parse(st_asgeojson);
		if (!geoJson.coordinates || !Array.isArray(geoJson.coordinates))
			return null;

		const coords = fromLonLat([geoJson.coordinates[0], geoJson.coordinates[1]]);
		return coords as [number, number];
	} catch (error) {
		console.warn("Failed to parse st_asgeojson:", error);
		return null;
	}
};

/**
 * Animates the map to the specified coordinates
 * Expects already transformed coordinates (use fromLonLat if needed)
 */
export const animateMapToCoordinates = (
	map: Map,
	coordinates: Coordinate,
	zoom: number = DEFAULT_ZOOM,
	duration: number = ANIMATION_DURATION,
) => {
	if (!map) return;

	map.getView().cancelAnimations();
	map.getView().animate({
		center: coordinates,
		duration,
		zoom,
	});
};
