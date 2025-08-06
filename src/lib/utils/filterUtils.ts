import { CategoryWithSubcategories, District, TransformedCategory, TransformedDistrict } from "@/types";
import enumMapDE from "@/lib/i18n/translations/de/enumMap.json";

export const transformCategories = (
  data: CategoryWithSubcategories[],
): TransformedCategory[] =>
  data.map((category) => ({
    categoryKey: category.key,
    categoryName:
      enumMapDE.category[category.key as keyof typeof enumMapDE.category] ||
      category.key,
    subcategories: category.subcategories.map((sub) => ({
      key: sub.key,
      name:
        enumMapDE.subcategory[sub.key as keyof typeof enumMapDE.subcategory] ||
        sub.key,
    })),
  }));

export const transformDistricts = (data: District[]): TransformedDistrict[] =>
  data.map((district) => ({
    key: district.key,
    name:
      enumMapDE.district_id[
        district.key as keyof typeof enumMapDE.district_id
      ] ||
      district.name ||
      district.key,
  }));