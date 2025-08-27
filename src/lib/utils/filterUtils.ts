import enumMapDE from "@/lib/i18n/translations/de/enumMap.json";
import {
	CategoryWithSubcategories,
	District,
	FilterState,
	InstitutionProperties,
} from "@/types";

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
		filters.include_closed !== undefined
	);
};

export const matchesDistrictFilter = (
	properties: InstitutionProperties,
	districtKeys: string[],
): boolean => {
	if (districtKeys.length === 0) return true;

	if (!properties.district?.key) return false;

	return districtKeys.includes(properties.district.key);
};

export const matchesCategoryFilter = (
	properties: InstitutionProperties,
	categoryKeys: string[],
): boolean => {
	return (
		properties.categories?.some((category) =>
			categoryKeys.includes(category.key),
		) || false
	);
};

export const matchesSubcategoryFilter = (
	properties: InstitutionProperties,
	subcategoryKeys: string[],
): boolean => {
	const hasExplicitMatch = properties.subcategories?.some((subcategory) =>
		subcategoryKeys.includes(subcategory.key),
	);

	if (hasExplicitMatch) return true;

	if (
		(!properties.subcategories || properties.subcategories.length === 0) &&
		properties.categories?.length > 0
	) {
		const hasVirtualOthersMatch = properties.categories.some((category) => {
			const othersKey = `others_${category.key}`;
			return subcategoryKeys.includes(othersKey);
		});

		if (hasVirtualOthersMatch) return true;
	}

	return false;
};

export const matchesStatusFilter = (
	properties: InstitutionProperties,
	includeClosedFilter: boolean,
): boolean => {
	if (
		!includeClosedFilter &&
		properties.utilization_status === "permanently_closed"
	) {
		return false;
	}
	return true;
};
