import { getLocalJson } from "@/lib/utils/mapUtils";
import { StyleSpecification } from "maplibre-gl";

export async function initMapStyle(): Promise<StyleSpecification> {
	const bezirksgrenzenGeoJSON = getLocalJson("/maps/bezirksgrenzen.json");
	const ortsteileGeoJSON = getLocalJson("/maps/ortsteile.json");
	const kulturorteGeoJSON = getLocalJson("/maps/venues.json");

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
			cartoBaseMap: {
				type: "raster",
				tiles: ["https://tile.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
				tileSize: 256,
				attribution:
					"&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, &copy; <a href='https://carto.com/attributions'>CartoDB</a>",
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
			kulturorte: {
				type: "geojson",
				data: kulturorteGeoJSON,
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
			// optional background map, uncomment if needed:
			// {
			// 	id: "cartoBaseMapLayer",
			// 	type: "raster",
			// 	source: "cartoBaseMap",
			// 	layout: {
			// 		visibility: "visible",
			// 	},
			// 	paint: {
			// 		"raster-saturation": 0,
			// 		"raster-contrast": 0,
			// 		"raster-opacity": 1,
			// 	},
			// },

			{
				id: "ortsteileLayer",
				type: "line",
				source: "ortsteile",
				paint: {
					"line-color": "#B32580",
					"line-width": 2,
				},
			},
			{
				id: "bezirksgrenzenLayer",
				type: "line",
				source: "bezirksgrenzen",
				paint: {
					"line-color": "#554AF4",
					"line-width": 2,
				},
			},
			{
				id: "kulturorteLayer",
				type: "circle",
				source: "kulturorte",
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
