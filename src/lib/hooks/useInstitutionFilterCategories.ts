"use client";

import { useCallback, useMemo } from "react";
import { useAccountStore } from "@/lib/store/accountStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { buildCategoryGroups } from "@/lib/utils/categoryUtils";
import type { Category } from "@/types/category";

export function useInstitutionFilterCategories() {
	const accountCategories = useAccountStore((state) => state.categories);
	const filterCategoriesFromInstitutionStore = useInstitutionStore(
		(state) => state.categories,
	);
	const initializePublicData = useInstitutionStore(
		(state) => state.initializePublicData,
	);

	const retryInitializeFilterCategories = useCallback(() => {
		void initializePublicData();
	}, [initializePublicData]);

	const filterCategoryGroups = useMemo(
		() =>
			buildCategoryGroups([
				...(filterCategoriesFromInstitutionStore ?? []),
				...accountCategories,
			]),
		[accountCategories, filterCategoriesFromInstitutionStore],
	);

	const flattenedCategories = useMemo<Category[]>(() => {
		const byId = new Map<number, Category>();

		filterCategoryGroups.forEach((category) => {
			byId.set(category.id, category);
			(category.child_categories ?? []).forEach((childCategory) => {
				byId.set(childCategory.id, childCategory);
			});
		});

		accountCategories.forEach((category) => {
			if (!byId.has(category.id)) {
				byId.set(category.id, category);
			}
		});

		return Array.from(byId.values());
	}, [accountCategories, filterCategoryGroups]);

	return {
		filterCategoryGroups,
		flattenedCategories,
		isFilterCategoriesLoading:
			filterCategoriesFromInstitutionStore === null &&
			accountCategories.length === 0,
		retryInitializeFilterCategories,
	};
}
