import enumMapDE from "@/lib/i18n/translations/de/enumMap.json";
import { CategoryWithSubcategories, District, FilterState } from "@/types";

export const addCategoryTranslations = (
	data: CategoryWithSubcategories[],
): CategoryWithSubcategories[] =>
	data.map((category) => ({
		...category,
		name:
			enumMapDE.category[category.key as keyof typeof enumMapDE.category] ||
			category.key,
		subcategories: category.subcategories.map((sub) => ({
			...sub,
			name:
				enumMapDE.subcategory[sub.key as keyof typeof enumMapDE.subcategory] ||
				sub.key,
		})),
	}));

export const addDistrictTranslations = (data: District[]): District[] =>
	data.map((district) => ({
		...district,
		name:
			enumMapDE.district_id[
				district.key as keyof typeof enumMapDE.district_id
			] ||
			district.name ||
			district.key,
	}));
	
export const hasActiveFilters = (filters: FilterState | null): boolean => {
	if (!filters) return false;
	return (
		filters.district_keys.length > 0 ||
		filters.category_keys.length > 0 ||
		filters.subcategory_keys.length > 0 ||
		filters.status !== undefined
	);
};
