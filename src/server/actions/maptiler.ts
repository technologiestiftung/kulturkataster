"use server";

import { logger } from "@/server/logging/logger";

export async function getMaptilerKey(): Promise<string | null> {
	const apiKey = process.env.MAPTILER_API_KEY;
	return apiKey ?? null;
}

export async function getMapBoundingBox(): Promise<string | null> {
	const bbox = process.env.MAP_BOUNDING_BOX;
	return bbox ?? null;
}

export async function getMapStyleUrl(): Promise<string | null> {
	const apiKey = process.env.MAPTILER_API_KEY;
	if (!apiKey) return null;
	return `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`;
}

export type ReverseGeocodeResult = {
	street?: string | null;
	streetNumber?: string | null;
	district?: string | null;
	neighbourhood?: string | null;
	city?: string | null;
	zipcode?: string | null;
};

export type GeocodeResult = {
	lat: number;
	lng: number;
};

export async function geocodeAddress(
	query: string,
): Promise<GeocodeResult | null> {
	const apiKey = process.env.MAPTILER_API_KEY;
	const bbox = process.env.MAP_BOUNDING_BOX;
	if (!apiKey) {
		logger.warn("maptiler.geocode.misconfigured", {
			subsystem: "map",
			missing_env: "MAPTILER_API_KEY",
		});
		return null;
	}
	if (!bbox) {
		logger.warn("maptiler.geocode.misconfigured", {
			subsystem: "map",
			missing_env: "MAP_BOUNDING_BOX",
		});
		return null;
	}

	const encoded = encodeURIComponent(query.trim());
	if (!encoded) return null;
	const params = new URLSearchParams({
		key: apiKey,
		country: "de",
		bbox,
		autocomplete: "true",
	});
	const url = `https://api.maptiler.com/geocoding/${encoded}.json?${params.toString()}`;

	try {
		const response = await logger.time(
			{
				level: "info",
				event: "maptiler.geocode.request.completed",
				successData: {
					provider: "maptiler",
					query_length: query.trim().length,
				},
				errorEvent: "maptiler.geocode.request.failed",
				errorData: {
					provider: "maptiler",
					query_length: query.trim().length,
				},
				slowThresholdMs: 1500,
				slowEvent: "maptiler.geocode.request.slow",
				slowData: {
					provider: "maptiler",
					query_length: query.trim().length,
				},
			},
			() => fetch(url),
		);
		if (!response.ok) {
			logger.warn("maptiler.geocode.http_error", {
				subsystem: "map",
				http_status: response.status,
				query_length: query.trim().length,
			});
			return null;
		}
		const data = await response.json();
		const feature = data?.features?.[0];
		const coords = feature?.center ?? feature?.geometry?.coordinates;
		if (!Array.isArray(coords) || coords.length < 2) return null;
		const [lng, lat] = coords;
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
		return { lat, lng };
	} catch (error) {
		logger.warn("maptiler.geocode.failed", {
			subsystem: "map",
			query_length: query.trim().length,
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}

export async function reverseGeocode(
	lat: number,
	lng: number,
): Promise<ReverseGeocodeResult | null> {
	const apiKey = process.env.MAPTILER_API_KEY;
	if (!apiKey) {
		logger.warn("maptiler.reverse_geocode.misconfigured", {
			subsystem: "map",
			missing_env: "MAPTILER_API_KEY",
		});
		return null;
	}

	const url = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${apiKey}`;

	try {
		const response = await logger.time(
			{
				level: "info",
				event: "maptiler.reverse_geocode.request.completed",
				successData: {
					provider: "maptiler",
				},
				errorEvent: "maptiler.reverse_geocode.request.failed",
				errorData: {
					provider: "maptiler",
				},
				slowThresholdMs: 1500,
				slowEvent: "maptiler.reverse_geocode.request.slow",
				slowData: {
					provider: "maptiler",
				},
			},
			() => fetch(url),
		);
		if (!response.ok) {
			logger.warn("maptiler.reverse_geocode.http_error", {
				subsystem: "map",
				http_status: response.status,
			});
			return null;
		}
		const data = await response.json();
		const feature = data?.features?.[0];
		if (!feature) return null;

		const street = feature.text ?? null;

		interface ContextItem {
			id: string;
			text: string;
		}
		const streetNumber = feature.address?.toString() ?? null;
		const city =
			feature.context?.find((obj: ContextItem) => obj.id.includes("region"))
				?.text ?? null;
		const district =
			feature.context?.find((obj: ContextItem) =>
				obj.id.includes("municipal_district"),
			)?.text ?? null;

		const neighbourhood =
			feature.context?.find((obj: ContextItem) => obj.id.includes("locality"))
				?.text ?? null;

		const zipcode =
			feature.context?.find((obj: ContextItem) =>
				obj.id.includes("postal_code"),
			)?.text ?? null;

		return {
			street,
			streetNumber,
			city,
			neighbourhood,
			district,
			zipcode,
		};
	} catch (error) {
		logger.warn("maptiler.reverse_geocode.failed", {
			subsystem: "map",
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}
