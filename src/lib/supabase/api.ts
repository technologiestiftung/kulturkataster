/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/client";
import type { Category, District } from "@/types";
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

export async function getCategoriesWithSubcategories(): Promise<Category[]> {
	const supabase = createClient();
	const { data: categories } = await supabase
		.from("category")
		.select(
			`
      id,
      key,
      created_at,
      subcategory (
        id,
        key,
        category_id,
        created_at
      )
    `,
		)
		.order("id");

	return categories || [];
}

export async function getDistricts(): Promise<District[]> {
	const staticDistrictMap = await import("./districtMap.json");
	return staticDistrictMap.default as District[];
}
