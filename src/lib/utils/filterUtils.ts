import enumMapDE from "@/lib/i18n/translations/de/enumMap.json";
import { CategoryWithSubcategories, District } from "@/types";

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
