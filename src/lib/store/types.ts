import maplibregl, { StyleSpecification } from "maplibre-gl";

export type MapState = {
	map: maplibregl.Map | null;
	setMap: (map: maplibregl.Map) => void;
	mapStyle: StyleSpecification | null;
	setMapStyle: (style: StyleSpecification) => void;
};
