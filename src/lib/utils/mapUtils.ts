/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-params */
import { fromLonLat } from "ol/proj";
import { Map } from "ol";
import { Coordinate } from "ol/coordinate";
import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

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
export function transformGeoJSON(
	collection: FeatureCollection<Geometry, GeoJsonProperties>,
	targetProjection = "EPSG:3857",
): FeatureCollection<Geometry, GeoJsonProperties> {
	function transformGeometry(geometry: Geometry | null | undefined) {
		if (!geometry) {
			return geometry;
		}

		if (geometry.type === "Point") {
			return {
				...geometry,
				coordinates: transformCoordinates(
					geometry.coordinates,
					targetProjection,
				),
			};
		} else if (
			geometry.type === "LineString" ||
			geometry.type === "MultiPoint"
		) {
			return {
				...geometry,
				coordinates: geometry.coordinates.map((coord) =>
					transformCoordinates(coord, targetProjection),
				),
			};
		} else if (
			geometry.type === "Polygon" ||
			geometry.type === "MultiLineString"
		) {
			return {
				...geometry,
				coordinates: geometry.coordinates.map((ring) =>
					ring.map((coord) => transformCoordinates(coord, targetProjection)),
				),
			};
		} else if (geometry.type === "MultiPolygon") {
			return {
				...geometry,
				coordinates: geometry.coordinates.map((polygon) =>
					polygon.map((ring) =>
						ring.map((coord) => transformCoordinates(coord, targetProjection)),
					),
				),
			};
		}

		return geometry;
	}

	return {
		...collection,
		features: collection.features.map((feature) => ({
			...feature,
			geometry: transformGeometry(feature.geometry) as Geometry,
		})),
	};
}

export function getEpsgFromCrs(crs: string) {
	const epsgMatch = crs.match(/EPSG[:/](\d+)/i);
	return epsgMatch ? `EPSG:${epsgMatch[1]}` : crs;
}

export const ANIMATION_DURATION = 1000;
export const DEFAULT_ZOOM = 9;

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

/**
 * gets a tailwind defined color from the dom, so it does need to be hard coded
 * Expects the correct color name
 */
export function getTailwindColor(name: string): string {
	return getComputedStyle(document.documentElement)
		.getPropertyValue(`--${name}`)
		.trim();
}

/**
 * gets a pixel value based on the root size for map elements styling and sizing
 * Expects a number of rem
 */
export const remToPx = (rem: number) =>
	rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
