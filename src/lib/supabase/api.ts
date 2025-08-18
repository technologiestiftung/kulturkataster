/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/client";
import type { CategoryWithSubcategories, District, FilterState } from "@/types";
import type { FeatureCollection } from "geojson";

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

	const { data, error } = await supabase.rpc("get_public_institutions", {
		search_term: trimmedQuery,
		limit_count: 50,
	});

	if (error) {
		handleError(error, "search institutions");
	}

	return data || [];
}

export async function filterInstitutions(query: FilterState) {
	const supabase = createClient();

	const { data, error } = await supabase.rpc(
		"get_public_institutions_with_filters",
		{
			district_keys: query.district_keys,
			category_keys: query.category_keys,
			subcategory_keys: query.subcategory_keys,
			include_closed: query.include_closed,
		},
	);

	if (error) {
		handleError(error, "filter institutions");
	}
	return data;
}

export async function getCategoriesWithSubcategories(): Promise<
	CategoryWithSubcategories[]
> {
	const staticCategoryMap = await import("./categoryMap.json");
	return staticCategoryMap.default as CategoryWithSubcategories[];
}

export async function getDistricts(): Promise<District[]> {
	const staticDistrictMap = await import("./districtMap.json");
	return staticDistrictMap.default as District[];
}
