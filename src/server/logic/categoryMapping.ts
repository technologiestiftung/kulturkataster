import type { Category } from "@/types";

type CategoryWithChildren = Category & { child_categories?: Category[] };

export const mapCategoriesWithSubcategories = (
	categories: CategoryWithChildren[],
): Category[] => {
	return categories
		.filter((category) => !category.parent_category_id)
		.map((category) => ({
			...category,
			subcategory: category.child_categories ?? [],
		})) as Category[];
};
