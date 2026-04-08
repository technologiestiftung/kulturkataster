"use server";

import { searchInstitutions } from "@/server/actions/institutions";
import { logger } from "@/server/logging/logger";
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
			institutionResults.status === "fulfilled"
				? (institutionResults.value as Institution[])
				: [];
		const addresses =
			addressResults.status === "fulfilled" ? addressResults.value : [];

		const allResults: SearchResult[] = [
			...(institutions as Institution[]),
			...(addresses as GeoFeature[]),
		];

		return {
			institutions,
			addresses,
			allResults,
		};
	} catch (error) {
		logger.error("search.locations.failed", error, {
			subsystem: "search",
			query_length: query.trim().length,
		});
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
		const bbox = process.env.MAP_BOUNDING_BOX;
		const apiKey = process.env.MAPTILER_API_KEY;
		const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
			query,
		)}.json?key=${apiKey}${bbox ? `&bbox=${bbox}` : ""}`;

		const response = await logger.time(
			{
				level: "info",
				event: "search.addresses.request.completed",
				successData: {
					query_length: query.trim().length,
					provider: "maptiler",
				},
				errorEvent: "search.addresses.request.failed",
				errorData: {
					query_length: query.trim().length,
					provider: "maptiler",
				},
				slowThresholdMs: 1500,
				slowEvent: "search.addresses.request.slow",
				slowData: {
					query_length: query.trim().length,
					provider: "maptiler",
				},
			},
			() => fetch(url),
		);

		if (!response.ok) {
			logger.warn("search.addresses.http_error", {
				subsystem: "search",
				http_status: response.status,
				query_length: query.trim().length,
				provider: "maptiler",
			});
			return [];
		}

		const data = await response.json();
		return data.features || [];
	} catch (error) {
		logger.warn("search.addresses.failed", {
			subsystem: "search",
			query_length: query.trim().length,
			provider: "maptiler",
			error: error instanceof Error ? error.message : String(error),
		});
		return [];
	}
}
