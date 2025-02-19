import { StyleSpecification } from "maplibre-gl";

export type MapState = {
	mapStyle: StyleSpecification | null;
	setMapStyle: (style: StyleSpecification) => void;
};
