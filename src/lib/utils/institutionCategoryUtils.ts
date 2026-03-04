import type { Category, FilterState } from "@/types";

const toNumberArray = (value: unknown): number[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => Number(item))
		.filter((item) => Number.isFinite(item));
};

const buildCategoryIndex = (categories: Category[]) => {
	const byKey = new Map<string, Category>();
	const byId = new Map<number, Category>();

	const register = (category: Category) => {
		byKey.set(category.key, category);
		byId.set(category.id, category);
	};

	categories.forEach((category) => {
		register(category);
		(category.child_categories ?? []).forEach((child) => {
			register(child);
		});
	});

	return { byKey, byId };
};

export const resolveCategoryIdsFromDraft = (
	input: Record<string, unknown>,
	categories: Category[],
): number[] => {
	const { byKey, byId } = buildCategoryIndex(categories);
	const selectedIds = new Set<number>();

	const addCategoryWithParent = (category: Category | undefined) => {
		if (!category) return;
		selectedIds.add(category.id);
		if (category.parent_category_id) {
			selectedIds.add(category.parent_category_id);
		}
	};

	const directIds = toNumberArray(input.categoryIds);
	if (directIds.length > 0) {
		directIds.forEach((id) => addCategoryWithParent(byId.get(id)));
		return Array.from(selectedIds);
	}

	const filters = input.categoryFilters as FilterState | undefined;
	if (!filters) return [];
	(filters.category_keys ?? []).forEach((key) => {
		addCategoryWithParent(byKey.get(key));
	});
	(filters.child_category_keys ?? []).forEach((key) => {
		addCategoryWithParent(byKey.get(key));
	});
	return Array.from(selectedIds);
};

export const resolveCategoriesFromDraft = (
	input: Record<string, unknown>,
	categories: Category[],
): Category[] | undefined => {
	const existing = input.categories as Category[] | undefined;
	if (Array.isArray(existing) && existing.length > 0) return existing;
	const ids = resolveCategoryIdsFromDraft(input, categories);
	if (ids.length === 0) return undefined;
	const { byId } = buildCategoryIndex(categories);
	return ids
		.map((id) => byId.get(id))
		.filter((category): category is Category => Boolean(category));
};
