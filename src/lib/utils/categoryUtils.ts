import { CategoryStatus } from "@/generated/prisma";
import type { Category, ChildCategory, Institution } from "@/types";

const toChildCategory = (
	category: Category,
	parentCategoryId: number,
): ChildCategory => {
	const now = new Date();

	return {
		id: category.id,
		key: category.key,
		description: category.description ?? null,
		icon: category.icon ?? null,
		status: category.status ?? CategoryStatus.active,
		parent_category_id: category.parent_category_id ?? parentCategoryId,
		created_at: category.created_at ?? now,
		updated_at: category.updated_at ?? now,
	};
};

export const buildCategoryGroups = (categories: Category[]): Category[] => {
	const parents = new Map<number, Category>();
	const childIdsByParentId = new Map<number, Set<number>>();
	const childrenById = new Map<number, Category>();

	const registerChild = (parentId: number, child: Category) => {
		const childIds = childIdsByParentId.get(parentId) ?? new Set<number>();
		childIds.add(child.id);
		childIdsByParentId.set(parentId, childIds);
		childrenById.set(child.id, child);
	};

	categories.forEach((category) => {
		if (category.parent_category_id) {
			registerChild(category.parent_category_id, category);
			return;
		}
		parents.set(category.id, category);
		(category.child_categories ?? []).forEach((child) => {
			registerChild(category.id, child);
		});
	});

	return Array.from(parents.values()).map((parent) => ({
		...parent,
		child_categories: Array.from(childIdsByParentId.get(parent.id) ?? [])
			.map((childId) => childrenById.get(childId))
			.filter((child): child is Category => Boolean(child))
			.map((child) => toChildCategory(child, parent.id)),
	}));
};

export const getEligibleParentCategories = (
	categories: Category[],
	excludedCategoryId?: number,
): Category[] =>
	categories.filter(
		(category) =>
			!category.parent_category_id &&
			(typeof excludedCategoryId !== "number" ||
				category.id !== excludedCategoryId),
	);

export const getParentCategories = (institution: Partial<Institution>) =>
	institution.categories?.filter((category) => !category.parent_category_id) ||
	[];

export const getSubcategories = (institution: Partial<Institution>) =>
	institution.categories?.filter((category) => !!category.parent_category_id) ||
	[];

export const getSubcategoriesForCategory = (
	institution: Partial<Institution>,
	categoryId: number,
) =>
	getSubcategories(institution).filter(
		(subcategory) => subcategory.parent_category_id === categoryId,
	);
