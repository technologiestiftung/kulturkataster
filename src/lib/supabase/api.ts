/* eslint-disable @typescript-eslint/no-explicit-any */
import venues from "@/config/resources/venues.json";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

// NOTE: Venues are called Institutions in Supabase

export async function getVenuesGeoJSON() {

	// FIXME: add response from staging
	return venues as FeatureCollection<Geometry, GeoJsonProperties>;
}
