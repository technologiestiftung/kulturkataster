/* eslint-disable @typescript-eslint/no-explicit-any */
import venues from "@/config/resources/venues.json";
import { createClient } from "@/lib/supabase/client";
import type { FeatureCollection } from "geojson";

// NOTE: Venues are called Institutions in Supabase

// Error handling
export class ApiError extends Error {
	constructor(
		message: string,
		public code?: string,
		public details?: unknown,
	) {
		super(message);
		this.name = "ApiError";
	}
}

// Utility functions
function handleError(error: any, context: string): never {
	console.error(`Error in ${context}:`, error);
	throw new ApiError(
		`Failed to ${context}: ${error.message}`,
		error.code,
		error.details,
	);
}

// function validateArrayResponse<T>(data: unknown, context: string): T[] {
// 	if (!Array.isArray(data)) {
// 		throw new ApiError(`Invalid data format in ${context}: expected array`);
// 	}
// 	return data as T[];
// }

function validateSingleResponse<T>(data: unknown, context: string): T {
	if (!data) {
		throw new ApiError(`No data returned from ${context}`);
	}
	return data as T;
}

export async function getVenuesGeoJSON() {
	const supabase = createClient();

	const { data, error } = await supabase.rpc("get_public_institutions_geojson");

	if (error) {
		handleError(error, "fetch institutions GeoJSON");
	}

	const validated = validateSingleResponse<FeatureCollection>(
		data,
		"getInstitutionsGeoJSON",
	);

	if (
		validated.type !== "FeatureCollection" ||
		!Array.isArray(validated.features)
	) {
		throw new Error("Invalid or missing GeoJSON structure in response");
	}

	// FIXME: add response from staging
	// return validated;
	return venues;
}
