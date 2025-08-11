"use server";

import { searchInstitutions } from "@/lib/supabase/api";
import { Institution, GeoFeature, SearchResult } from "@/types/institution";

interface SearchLocationsResult {
	institutions: Institution[];
	addresses: GeoFeature[];
	allResults: SearchResult[];
}

export async function searchLocations(
	query: string,
): Promise<SearchLocationsResult> {
	if (query.trim().length < 2) {
		return {
			institutions: [],
			addresses: [],
			allResults: [],
		};
	}

	try {
		const [institutionResults, addressResults] = await Promise.allSettled([
			searchInstitutions(query),
			searchAddresses(query),
		]);

		const institutions =
			institutionResults.status === "fulfilled" ? institutionResults.value : [];
		const addresses =
			addressResults.status === "fulfilled" ? addressResults.value : [];

		const allResults: SearchResult[] = [...institutions, ...addresses];

		return {
			institutions,
			addresses,
			allResults,
		};
	} catch (error) {
		console.error("Search locations error:", error);
		return {
			institutions: [],
			addresses: [],
			allResults: [],
		};
	}
}

async function searchAddresses(query: string): Promise<GeoFeature[]> {
	if (query.trim().length < 3) {
		return [];
	}

	try {
		const bbox = process.env.NEXT_PUBLIC_MAP_BOUNDING_BOX;
		const apiKey = process.env.MAPTILER_API_KEY;
		const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
			query,
		)}.json?key=${apiKey}${bbox ? `&bbox=${bbox}` : ""}`;

		const response = await fetch(url);

		if (!response.ok) {
			console.warn(`Address search failed with status: ${response.status}`);
			return [];
		}

		const data = await response.json();
		return data.features || [];
	} catch (error) {
		console.warn("Address search error:", error);
		return [];
	}
}
