"use client";

import {
	getCategoriesWithSubcategories,
	getDistricts,
} from "@/lib/supabase/api";
import {
	addCategoryTranslations,
	addDistrictTranslations,
} from "@/lib/utils/filterUtils";
import { CategoryWithSubcategories, District } from "@/types";
import { useCallback, useEffect, useState } from "react";
export const useFilterData = () => {
	const [categoryGroups, setCategoryGroups] = useState<
		CategoryWithSubcategories[]
	>([]);
	const [districts, setDistricts] = useState<District[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [categoriesData, districtsData] = await Promise.all([
					getCategoriesWithSubcategories(),
					getDistricts(),
				]);

				setCategoryGroups(addCategoryTranslations(categoriesData));
				setDistricts(addDistrictTranslations(districtsData));
			} catch (err) {
				console.error("Error fetching filter data:", err);
				setError("Failed to load filter data");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const retry = useCallback(() => {
		setLoading(true);
		setError(null);
		Promise.all([getCategoriesWithSubcategories(), getDistricts()])
			.then(([categoriesData, districtsData]) => {
				setCategoryGroups(addCategoryTranslations(categoriesData));
				setDistricts(addDistrictTranslations(districtsData));
			})
			.catch((err) => {
				console.error("Error fetching filter data:", err);
				setError("Failed to load filter data");
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return { categoryGroups, districts, loading, error, retry };
};
