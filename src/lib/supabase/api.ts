/* eslint-disable @typescript-eslint/no-explicit-any */
import venues from "@/config/resources/venues.json";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

// NOTE: Venues are called Institutions in Supabase

export async function getVenuesGeoJSON() {
	// FIXME: add response from staging
	return venues as FeatureCollection<Geometry, GeoJsonProperties>;
}

export async function searchInstitutions(query: string) {
	const supabase = createClient();

	if (!query || query.trim().length === 0) {
		return [];
	}

	const trimmedQuery = query.trim();

	// Use the backend RPC function for search
	const { data, error } = await supabase.rpc("get_public_institutions", {
		search_term: trimmedQuery,
		limit_count: 50,
	});

	if (error) {
		handleError(error, "search institutions");
	}

	// Return the institutions array directly
	return data || [];
}
