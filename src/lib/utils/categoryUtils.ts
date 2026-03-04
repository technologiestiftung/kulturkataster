import type { Category, Institution } from "@/types";

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
