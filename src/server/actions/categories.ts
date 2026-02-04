"use server";

import { categoryRepo } from "@/server/data/categoryRepo";
import {
	authorizeTable,
	getAccessContextForUser,
	requireAllScope,
} from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/actions/auth";
import { CategoryStatus } from "@/generated/prisma";
import type { Category } from "@/types";

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
	authorizeTable(ctx, "category", "read");

	return categoryRepo.listAll();
}

export async function getCategoriesWithSubcategories(): Promise<Category[]> {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "category", "read");

	const categories = await categoryRepo.listWithChildren();
	return categories.filter((category) => !category.parent_category_id);
}

export async function getCategoryById(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "category", "read");

	return categoryRepo.findById(id);
}

export async function createCategory(input: CategoryInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "category", "create");
	requireAllScope(ctx, "category", "create");

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
	authorizeTable(ctx, "category", "update");
	requireAllScope(ctx, "category", "update");

	if (input.parentCategoryId && input.parentCategoryId === input.id) {
		throw new Error("Category cannot be its own parent.");
	}

	let parentCategoryUpdate;
	if (input.parentCategoryId === null) {
		parentCategoryUpdate = { disconnect: true };
	} else if (input.parentCategoryId) {
		parentCategoryUpdate = { connect: { id: input.parentCategoryId } };
	} else {
		parentCategoryUpdate = undefined;
	}

	return categoryRepo.update(input.id, {
		key: input.key,
		description: input.description ?? null,
		icon: input.icon ?? null,
		status: input.status,
		parent_category: parentCategoryUpdate,
	});
}

export async function deleteCategory(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "category", "delete");
	requireAllScope(ctx, "category", "delete");

	const category = await categoryRepo.findById(id);
	if (category?.child_categories?.length) {
		throw new Error("Category has subcategories and cannot be deleted.");
	}

	await categoryRepo.remove(id);
	return { id };
}
