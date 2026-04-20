"use server";

import {
	actionError,
	actionOk,
	getActionErrorCode,
	type ActionResult,
} from "@/lib/actions/actionResult";
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
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";
import { logger } from "../logging/logger";

export type CategoryActionErrorCode =
	| "keyTaken"
	| "notFound"
	| "keyLocked"
	| "selfParent"
	| "hasSubcategories"
	| "forbidden"
	| "unexpected";

const classifyCategoryActionError = (
	error: unknown,
): CategoryActionErrorCode => {
	const errorCode = getActionErrorCode(error);
	if (errorCode === "P2002") return "keyTaken";
	if (errorCode === "P2025") return "notFound";
	if (error instanceof Error && error.name === "RBACError") {
		return "forbidden";
	}
	return "unexpected";
};

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
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_|_$/g, "");

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

export async function createCategory(
	input: CategoryInput,
): Promise<
	ActionResult<
		Awaited<ReturnType<typeof categoryRepo.create>>,
		CategoryActionErrorCode
	>
> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "category", "create");
			requireAllScope(ctx, "category", "create");
			const sanitizedKey = sanitizeKey(input.key);

			let created;
			try {
				created = await categoryRepo.create({
					key: sanitizedKey,
					description: input.description ?? null,
					icon: input.icon ?? null,
					status: input.status ?? "active",
					parent_category: {
						connect: input.parentCategoryId
							? { id: input.parentCategoryId }
							: undefined,
					},
				});
			} catch (error) {
				logger.error("category.create.db_failed", error, {
					subsystem: "category",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					category_key: sanitizedKey,
				});
				return actionError(classifyCategoryActionError(error));
			}

			if (
				input.localizedLabels &&
				Object.keys(input.localizedLabels).length > 0
			) {
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
					logger.warn("category.translations.sync_failed", {
						subsystem: "translations",
						term_key: termKey,
						category_key: created.key,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}

			return actionOk(created);
		},
		{ route: "server_action:categories.createCategory" },
	);
}

export async function updateCategory(
	input: CategoryUpdateInput,
): Promise<
	ActionResult<
		Awaited<ReturnType<typeof categoryRepo.update>>,
		CategoryActionErrorCode
	>
> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "category", "update");
			requireAllScope(ctx, "category", "update");

			if (input.parentCategoryId && input.parentCategoryId === input.id) {
				return actionError("selfParent");
			}

			let existingCategory;
			try {
				existingCategory = await categoryRepo.findById(input.id);
			} catch (error) {
				logger.error("category.update.lookup_db_failed", error, {
					subsystem: "category",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					category_id: input.id,
				});
				return actionError(classifyCategoryActionError(error));
			}
			if (!existingCategory) {
				return actionError("notFound");
			}

			if (
				typeof input.key === "string" &&
				sanitizeKey(input.key) !== existingCategory.key
			) {
				return actionError("keyLocked");
			}

			let parentCategoryUpdate;
			if (input.parentCategoryId === null) {
				parentCategoryUpdate = { disconnect: true };
			} else if (input.parentCategoryId) {
				parentCategoryUpdate = { connect: { id: input.parentCategoryId } };
			} else {
				parentCategoryUpdate = undefined;
			}

			let updated;
			try {
				updated = await categoryRepo.update(input.id, {
					description: input.description ?? null,
					icon: input.icon ?? null,
					status: input.status,
					parent_category: parentCategoryUpdate,
				});
			} catch (error) {
				logger.error("category.update.db_failed", error, {
					subsystem: "category",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					category_id: input.id,
				});
				return actionError(classifyCategoryActionError(error));
			}

			if (
				input.localizedLabels &&
				Object.keys(input.localizedLabels).length > 0
			) {
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
					logger.warn("category.translations.sync_failed", {
						subsystem: "translations",
						term_key: termKey,
						category_id: updated.id,
						category_key: updated.key,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}

			return actionOk(updated);
		},
		{ route: "server_action:categories.updateCategory" },
	);
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

export async function deleteCategory(
	id: number,
): Promise<ActionResult<{ id: number }, CategoryActionErrorCode>> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "category", "delete");
			requireAllScope(ctx, "category", "delete");

			let category;
			try {
				category = await categoryRepo.findById(id);
			} catch (error) {
				logger.error("category.delete.lookup_db_failed", error, {
					subsystem: "category",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					category_id: id,
				});
				return actionError(classifyCategoryActionError(error));
			}
			if (category?.child_categories?.length) {
				return actionError("hasSubcategories");
			}

			try {
				await categoryRepo.remove(id);
			} catch (error) {
				logger.error("category.delete.db_failed", error, {
					subsystem: "category",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					category_id: id,
				});
				return actionError(classifyCategoryActionError(error));
			}
			return actionOk({ id });
		},
		{ route: "server_action:categories.deleteCategory" },
	);
}

export async function uploadCategoryIcon(formData: FormData): Promise<string> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
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
				if (
					createBucketError &&
					!isAlreadyExistsError(createBucketError.message)
				) {
					throw new Error(
						`Icon bucket setup failed: ${createBucketError.message}`,
					);
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
		},
		{ route: "server_action:categories.uploadCategoryIcon" },
	);
}
