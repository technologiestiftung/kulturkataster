import fs from "fs";
import path from "path";
import proj4 from "proj4";

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

export function getLocalGeojson(url: string) {
	const filePath = path.join(process.cwd(), "public", url);
	const geojson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
	return geojson;
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
