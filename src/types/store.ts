import maplibregl, { StyleSpecification } from "maplibre-gl";
import { VenueProperties } from "./venue";

export type MapState = {
	map: maplibregl.Map | null;
	setMap: (map: maplibregl.Map) => void;
	mapStyle: StyleSpecification | null;
	setMapStyle: (style: StyleSpecification) => void;
};

export type VenueState = {
	selectedVenueId: string;
	setSelectedVenueId: (id: string) => void;
	selectedVenueProperties: VenueProperties | null;
	setSelectedVenueProperties: (properties: VenueProperties | null) => void;
};
