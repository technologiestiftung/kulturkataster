import { MapGeoJSONFeature, MapMouseEvent } from "maplibre-gl";

export type AppMapMouseEvent = MapMouseEvent & {
	features?: MapGeoJSONFeature[];
};
