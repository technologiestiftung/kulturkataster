"use client";

import {
	getCategoriesWithSubcategories,
	getDistricts,
} from "@/lib/supabase/api";
import {
	transformCategories,
	transformDistricts,
} from "@/lib/utils/filterUtils";
import { TransformedCategory, TransformedDistrict } from "@/types";
import { useCallback, useEffect, useState } from "react";
export const useFilterData = () => {
	const [categoryGroups, setCategoryGroups] = useState<TransformedCategory[]>(
		[],
	);
	const [districts, setDistricts] = useState<TransformedDistrict[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [categoriesData, districtsData] = await Promise.all([
					getCategoriesWithSubcategories(),
					getDistricts(),
				]);

				setCategoryGroups(transformCategories(categoriesData));
				setDistricts(transformDistricts(districtsData));
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
				setCategoryGroups(transformCategories(categoriesData));
				setDistricts(transformDistricts(districtsData));
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
