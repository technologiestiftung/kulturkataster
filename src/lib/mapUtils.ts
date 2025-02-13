import fs from "fs";
import path from "path";

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
