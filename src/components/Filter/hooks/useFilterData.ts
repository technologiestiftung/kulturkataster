"use client";

import {
	getCategoriesWithSubcategories,
	getDistricts,
} from "@/lib/supabase/api";
import { Category, District } from "@/types";
import { useCallback, useEffect, useState } from "react";
export const useFilterData = () => {
	const [categoryGroups, setCategoryGroups] = useState<Category[]>([]);
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

				setCategoryGroups(categoriesData);
				setDistricts(districtsData);
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
				setCategoryGroups(categoriesData);
				setDistricts(districtsData);
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
