"use server";

import type { Category } from "@/types";
import { authorizeTable, getAccessContextForUser } from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";
import { institutionRepo } from "@/server/data/institutionRepo";
import { categoryRepo } from "@/server/data/categoryRepo";
import { districtRepo } from "@/server/data/districtRepo";
import { buildInstitutionSearchWhere } from "@/server/logic/institutionSearch";
import { mapCategoriesWithSubcategories } from "@/server/logic/categoryMapping";
import { buildInstitutionSelect } from "@/server/logic/institutionSelect";

export async function getInstitutions() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "read");

	const select = buildInstitutionSelect(ctx);
	if (!select) return [];
	return institutionRepo.listWithSelect(select);
}

export async function searchInstitutions(query: string) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "read");

	if (!query || query.trim().length === 0) {
		return [];
	}

	const where = buildInstitutionSearchWhere(query);
	if (!where) return [];

	const select = buildInstitutionSelect(ctx);
	if (!select) return [];
	return institutionRepo.searchWithSelect(where, select);
}

export async function getCategoriesWithSubcategories(): Promise<Category[]> {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "category", "read");

	const categories = await categoryRepo.listWithChildren();
	return mapCategoriesWithSubcategories(categories);
}

export async function getDistricts(): Promise<string[]> {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "address", "read");

	const districts = await districtRepo.listDistinct();
	return districts
		.map((row) => row.district)
		.filter((district): district is string => !!district);
}
