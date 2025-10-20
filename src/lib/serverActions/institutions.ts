/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import type { Category, District, FilterState } from "@/types";
import type { FeatureCollection } from "geojson";
import { ApiError } from "../utils/errorUtils";

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
	const supabase = await createClient();

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
	const supabase = await createClient();

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
	const supabase = await createClient();

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

export async function getCategoriesWithSubcategories(): Promise<Category[]> {
	const supabase = await createClient();

	const { data: categories, error } = await supabase
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

	if (error) {
		console.error("Error fetching categories:", error);
		return [];
	}

	return categories || [];
}

export async function getDistricts(): Promise<District[]> {
	const supabase = await createClient();

	const { data: districts, error } = await supabase
		.from("district")
		.select("*")
		.order("id");

	if (error) {
		console.error("Error fetching districts:", error);
		return [];
	}

	return districts || [];
}
