/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/client";
import type { FilterState } from "@/types";
import type { FeatureCollection } from "geojson";
import staticCategoryMap from "./categoryMap.json";
import staticDistrictMap from "./districtMap.json";

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

export async function getInstitutionsGeoJSON() {
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

	return validated;
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

export async function filterInstitutions(query: FilterState) {
	console.log("[api] query::", query);
	const supabase = createClient();

	// For now, we'll use the district-based filtering and can extend it later
	// to include category, subcategory, and status filtering when the backend supports it
	const { data, error } = await supabase.rpc(
		"get_public_institutions_by_districts_geojson",
		{
			district_keys: query.district_keys,
		},
	);

	// TODO: Extend API to support these parameters when backend is ready:
	// const { data, error } = await supabase.rpc(
	// 	"get_public_institutions_by_filters_geojson",
	// 	{
	// 		district_keys: query.district_keys,
	// 		category_keys: query.category_keys,
	// 		subcategory_keys: query.subcategory_keys,
	// 		status: query.status,
	// 	},
	// );

	if (error) {
		handleError(error, "filter institutions");
	}

	console.log("[api] filtered data::", data);

	// Type cast the imported JSON to proper FeatureCollection type
	// return localFilteredVenues as FeatureCollection;
	return data;
}

export async function getCategoriesWithSubcategories() {
	// get_public_category_map
	return staticCategoryMap;
}

export async function getDistricts() {
	// get_public_district_map
	return staticDistrictMap;
}
