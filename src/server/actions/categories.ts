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
import { createAdminClient } from "@/server/supabase/server";
import {
	getCategoryEnumMapTermKey,
	getEnumMapTermTranslations,
	upsertEnumMapTermTranslations,
} from "@/server/logic/traduoraTermTranslations";

type CategoryInput = {
	key: string;
	description?: string | null;
	icon?: string | null;
	status?: CategoryStatus;
	parentCategoryId?: number | null;
	localizedLabels?: Record<string, string | undefined>;
};

type CategoryUpdateInput = {
	id: number;
	key?: string;
	description?: string | null;
	icon?: string | null;
	status?: CategoryStatus;
	parentCategoryId?: number | null;
	localizedLabels?: Record<string, string | undefined>;
};

const CATEGORY_ICON_BUCKET =
	process.env.SUPABASE_CATEGORY_ICONS_BUCKET ?? "category-icons";

const sanitizeKey = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9_-]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

const isBucketNotFoundError = (message: string | undefined) =>
	typeof message === "string" &&
	message.toLowerCase().includes("bucket not found");

const isAlreadyExistsError = (message: string | undefined) =>
	typeof message === "string" &&
	(message.toLowerCase().includes("already exists") ||
		message.toLowerCase().includes("duplicate"));

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

	const created = await categoryRepo.create({
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

	if (input.localizedLabels && Object.keys(input.localizedLabels).length > 0) {
		const termKey = getCategoryEnumMapTermKey({
			key: created.key,
			parentCategoryId: created.parent_category_id,
		});
		try {
			await upsertEnumMapTermTranslations({
				termKey,
				translations: input.localizedLabels,
			});
		} catch (error) {
			console.warn("[category] failed to sync traduora translations", error);
		}
	}

	return created;
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

	const updated = await categoryRepo.update(input.id, {
		key: input.key,
		description: input.description ?? null,
		icon: input.icon ?? null,
		status: input.status,
		parent_category: parentCategoryUpdate,
	});

	if (input.localizedLabels && Object.keys(input.localizedLabels).length > 0) {
		const termKey = getCategoryEnumMapTermKey({
			key: updated.key,
			parentCategoryId: updated.parent_category_id,
		});
		try {
			await upsertEnumMapTermTranslations({
				termKey,
				translations: input.localizedLabels,
			});
		} catch (error) {
			console.warn("[category] failed to sync traduora translations", error);
		}
	}

	return updated;
}

export async function getCategoryLocalizedLabels(params: {
	key: string;
	parentCategoryId?: number | null;
}) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "category", "read");

	const termKey = getCategoryEnumMapTermKey({
		key: params.key,
		parentCategoryId: params.parentCategoryId,
	});
	return getEnumMapTermTranslations({
		termKey,
		locales: ["de", "en"],
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

export async function uploadCategoryIcon(formData: FormData): Promise<string> {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "category", "update");
	requireAllScope(ctx, "category", "update");

	const keyValue = formData.get("key");
	const fileValue = formData.get("file");
	const categoryIdValue = formData.get("categoryId");

	if (typeof keyValue !== "string" || !keyValue.trim()) {
		throw new Error("Category key is required for icon upload.");
	}
	if (!(fileValue instanceof File)) {
		throw new Error("No icon file provided.");
	}

	const isSvgByMime = fileValue.type === "image/svg+xml";
	const isSvgByName = fileValue.name.toLowerCase().endsWith(".svg");
	if (!isSvgByMime && !isSvgByName) {
		throw new Error("Only SVG files are supported.");
	}

	const admin = createAdminClient();
	const safeKey = sanitizeKey(keyValue);
	const filePath =
		typeof categoryIdValue === "string" && categoryIdValue
			? `categories/${sanitizeKey(categoryIdValue)}.svg`
			: `categories/${safeKey}.svg`;

	const upload = () =>
		admin.storage.from(CATEGORY_ICON_BUCKET).upload(filePath, fileValue, {
			cacheControl: "3600",
			contentType: "image/svg+xml",
			upsert: true,
		});

	let { error } = await upload();

	if (error && isBucketNotFoundError(error.message)) {
		const { error: createBucketError } = await admin.storage.createBucket(
			CATEGORY_ICON_BUCKET,
			{
				public: true,
				allowedMimeTypes: ["image/svg+xml"],
			},
		);
		if (createBucketError && !isAlreadyExistsError(createBucketError.message)) {
			throw new Error(`Icon bucket setup failed: ${createBucketError.message}`);
		}
		({ error } = await upload());
	}

	if (error) {
		throw new Error(`Icon upload failed: ${error.message}`);
	}

	const { data } = admin.storage
		.from(CATEGORY_ICON_BUCKET)
		.getPublicUrl(filePath);
	return data.publicUrl;
}
