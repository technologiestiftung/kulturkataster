import categoryMap from "@/lib/supabase/categoryMap.json";
import { Category, Subcategory } from "@/types";

/**
 * Gets the subcategories that belong to a specific category and are present in the institution's subcategories
 */
export const getMatchingSubcategories = (
	category: Category,
	institutionSubcategories: Subcategory[],
): Subcategory[] => {
	const categoryData = categoryMap.find((cat) => cat.key === category.key);

	if (!categoryData || !categoryData.subcategories) {
		return [];
	}
	const categorySubcategoryKeys = categoryData.subcategories.map(
		(sub) => sub.key,
	);

	return institutionSubcategories.filter((subcategory) =>
		categorySubcategoryKeys.includes(subcategory.key),
	);
};
