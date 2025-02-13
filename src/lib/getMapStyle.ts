import { StyleSpecification } from "maplibre-gl";
import { getLocalGeojson } from "./mapUtils";

export async function getMapStyle(): Promise<StyleSpecification> {
	const bezirksgrenzenGeoJSON = getLocalGeojson("/maps/bezirksgrenzen.json");
	const ortsteileGeoJSON = getLocalGeojson("/maps/ortsteile.json");

	return {
		name: "basemap:grey",
		version: 8,
		metadata: {},
		center: [13.404954, 52.520008],
		zoom: 10,
		sources: {
			osmBaseMap: {
				type: "raster",
				tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
				tileSize: 256,
				attribution:
					"&copy; <a href='https://www.openstreetmap.org/copyright'>Kulturkataster</a> contributors",
				bounds: [13.076477, 52.340374, 13.760376, 52.664723],
			},
			randomPoints: {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: [
						{
							type: "Feature",
							properties: { color: "#ff0000" },
							geometry: { type: "Point", coordinates: [13.405, 52.52] },
						},
						{
							type: "Feature",
							properties: { color: "#00ff00" },
							geometry: { type: "Point", coordinates: [13.39, 52.51] },
						},
						{
							type: "Feature",
							properties: { color: "#0000ff" },
							geometry: { type: "Point", coordinates: [13.42, 52.515] },
						},
						{
							type: "Feature",
							properties: { color: "#ff00ff" },
							geometry: { type: "Point", coordinates: [13.37, 52.525] },
						},
						{
							type: "Feature",
							properties: { color: "#ffff00" },
							geometry: { type: "Point", coordinates: [13.43, 52.505] },
						},
					],
				},
			},
			bezirksgrenzen: {
				type: "geojson",
				data: bezirksgrenzenGeoJSON,
			},
			ortsteile: {
				type: "geojson",
				data: ortsteileGeoJSON,
			},
		},
		glyphs: "./data/{fontstack}/{range}.pbf",
		layers: [
			{
				id: "background",
				type: "background",
				paint: {
					"background-color": "#f0f0f0",
				},
			},
			{
				id: "osmBaseMap",
				type: "raster",
				source: "osmBaseMap",
				layout: {
					visibility: "visible",
				},
				paint: {
					"raster-saturation": -1,
					"raster-contrast": 0.2,
					"raster-opacity": 1,
				},
			},
			{
				id: "randomPointsLayer",
				type: "circle",
				source: "randomPoints",
				paint: {
					"circle-radius": 8,
					"circle-color": ["get", "color"],
					"circle-stroke-width": 2,
					"circle-stroke-color": "#ffffff",
				},
			},
			{
				id: "ortsteileLayer",
				type: "line",
				source: "ortsteile",
				paint: {
					"line-color": "pink",
					"line-width": 2,
				},
			},
			{
				id: "bezirksgrenzenLayer",
				type: "line",
				source: "bezirksgrenzen",
				paint: {
					"line-color": "#198EC8",
					"line-width": 2,
				},
			},
		],
	};
}
