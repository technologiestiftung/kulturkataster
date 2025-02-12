import { StyleSpecification } from "maplibre-gl";

export const mapStyle: StyleSpecification = {
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
		wmsBezirke: {
			type: "raster",
			tiles: [
				// `https://gdi.berlin.de/services/wms/alkis_bezirke?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=alkis_bezirke&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&FORMAT=image/png`,
				"https://gdi.berlin.de/services/wms/alkis_bezirke?" +
					"SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&" +
					"LAYERS=alkis_bezirke&" +
					"WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true",
			],
			tileSize: 256,
			attribution: "Source: GDI Berlin",
		},
	},
	glyphs: "./data/{fontstack}/{range}.pbf",
	layers: [
		{
			id: "background",
			type: "background",
			paint: {
				"background-color": "#fff",
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
	],
};
