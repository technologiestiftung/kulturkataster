import { getLocalJson } from "@/lib/utils/mapUtils";
import { StyleSpecification } from "maplibre-gl";

export async function initMapStyle(): Promise<StyleSpecification> {
	const bezirksgrenzenGeoJSON = getLocalJson("/maps/bezirksgrenzen.json");
	const ortsteileGeoJSON = getLocalJson("/maps/ortsteile.json");

	return {
		name: "kulturkataster",
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
				bounds: [12.911237, 52.314615, 13.895887, 52.710764],
			},
			bezirksgrenzen: {
				type: "geojson",
				data: bezirksgrenzenGeoJSON,
			},
			ortsteile: {
				type: "geojson",
				data: ortsteileGeoJSON,
			},
			kukaPoints: {
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
			{
				id: "kukaPointsLayer",
				type: "circle",
				source: "kukaPoints",
				paint: {
					"circle-radius": 8,
					"circle-color": ["get", "color"],
					"circle-stroke-width": 2,
					"circle-stroke-color": "#ffffff",
				},
			},
		],
	};
}
