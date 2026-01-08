"use server";

import type { Category } from "@/types";
import { getAccessContextForUser, throwIfUnauthorized } from "@/lib/utils/rbac";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";
import { institutionRepo } from "@/server/data/institutionRepo";
import { categoryRepo } from "@/server/data/categoryRepo";
import { districtRepo } from "@/server/data/districtRepo";
import { buildInstitutionSearchWhere } from "@/server/logic/institutionSearch";
import { mapCategoriesWithSubcategories } from "@/server/logic/categoryMapping";

export async function getInstitutions() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	throwIfUnauthorized({
		context: ctx,
		resource: "institutions",
		action: "read",
	});

	return institutionRepo.list();
}

export async function searchInstitutions(query: string) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	throwIfUnauthorized({
		context: ctx,
		resource: "institutions",
		action: "read",
	});

	if (!query || query.trim().length === 0) {
		return [];
	}

	const where = buildInstitutionSearchWhere(query);
	if (!where) return [];

	return institutionRepo.search(where);
}

export async function getCategoriesWithSubcategories(): Promise<Category[]> {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	throwIfUnauthorized({
		context: ctx,
		resource: "categories",
		action: "read",
	});

	const categories = await categoryRepo.listWithChildren();
	return mapCategoriesWithSubcategories(categories);
}

export async function getDistricts(): Promise<string[]> {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	throwIfUnauthorized({
		context: ctx,
		resource: "addresses",
		action: "read",
	});

	const districts = await districtRepo.listDistinct();
	return districts
		.map((row) => row.district)
		.filter((district): district is string => !!district);
}
