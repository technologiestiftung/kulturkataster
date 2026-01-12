"use server";

import { categoryRepo } from "@/server/data/categoryRepo";
import {
	authorizeFields,
	authorizeTable,
	getAccessContextForUser,
} from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";
import { CategoryStatus } from "@/generated/prisma";
import type { Category } from "@/types";
import { mapCategoriesWithSubcategories } from "@/server/logic/categoryMapping";

type CategoryInput = {
	key: string;
	description?: string | null;
	icon?: string | null;
	status?: CategoryStatus;
	parentCategoryId?: number | null;
};

type CategoryUpdateInput = {
	id: number;
	key?: string;
	description?: string | null;
	icon?: string | null;
	status?: CategoryStatus;
	parentCategoryId?: number | null;
};

export async function getCategories() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "categories", "read");

	return categoryRepo.listAll();
}

export async function getCategoriesWithSubcategories(): Promise<Category[]> {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "categories", "read");

	const categories = await categoryRepo.listWithChildren();
	return mapCategoriesWithSubcategories(categories);
}

export async function createCategory(input: CategoryInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "categories", "create");

	return categoryRepo.create({
		key: input.key,
		description: input.description ?? null,
		icon: input.icon ?? null,
		status: input.status ?? "active",
		parent_category: {
			connect: input.parentCategoryId
				? { id: input.parentCategoryId }
				: undefined,
		},
	});
}

export async function updateCategory(input: CategoryUpdateInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "categories", "update");

	if (input.parentCategoryId && input.parentCategoryId === input.id) {
		throw new Error("Category cannot be its own parent.");
	}

	return categoryRepo.update(input.id, {
		key: input.key,
		description: input.description ?? null,
		icon: input.icon ?? null,
		status: input.status,
		parent_category: {
			connect: input.parentCategoryId
				? { id: input.parentCategoryId }
				: undefined,
		},
	});
}

export async function deleteCategory(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "categories", "delete");

	return categoryRepo.remove(id);
}
