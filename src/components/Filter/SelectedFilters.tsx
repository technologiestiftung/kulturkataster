"use client";

import { Button } from "@/components/ui/button";
import { FilterState, District, Category } from "@/types";
import Close from "@/icons/close.svg";

interface SelectedFiltersProps {
	filters: FilterState;
	districts: District[];
	categories: Category[];
	onRemoveDistrict?: (key: string) => void;
	onRemoveCategory?: (key: string) => void;
	onRemoveSubcategory?: (key: string) => void;
	showRemove?: boolean;
	className?: string;
}

export function SelectedFilters({
	filters,
	districts,
	categories,
	onRemoveDistrict,
	onRemoveCategory,
	onRemoveSubcategory,
	showRemove = false,
	className = "",
}: SelectedFiltersProps) {
	const getDistrictName = (key: string) => {
		const district = districts.find((d) => d.key === key);
		return district?.name || key;
	};

	const getCategoryName = (key: string) => {
		const category = categories.find((c) => c.key === key);
		return category?.key || key;
	};

	const getSubcategoryName = (key: string) => {
		for (const category of categories) {
			const subcategory = (category.subcategory ?? []).find(
				(s) => s.key === key,
			);
			if (subcategory) {
				return subcategory.key;
			}
		}
		return key;
	};

	const hasAnyFilters =
		filters.district_keys.length > 0 ||
		filters.category_keys.length > 0 ||
		filters.subcategory_keys.length > 0;

	if (!hasAnyFilters) {
		return null;
	}

	return (
		<div className={`flex flex-wrap gap-2 ${className}`}>
			{/* District filters */}
			{filters.district_keys.map((key) => (
				<Button
					key={`district-${key}`}
					variant="tag"
					size="tag"
					className={showRemove ? "bg-neutral-80 text-white" : ""}
					onClick={showRemove ? () => onRemoveDistrict?.(key) : undefined}
				>
					{getDistrictName(key)}
					{showRemove && (
						<span className="ml-0 w-full">
							<Close size={4} viewBox="0 0 24 24" />
						</span>
					)}
				</Button>
			))}

			{/* Category filters */}
			{filters.category_keys.map((key) => (
				<Button
					key={`category-${key}`}
					variant="tag"
					size="tag"
					className={showRemove ? "bg-neutral-80 text-white" : ""}
					onClick={showRemove ? () => onRemoveCategory?.(key) : undefined}
				>
					{getCategoryName(key)}
					{showRemove && (
						<span className="ml-0 w-full">
							<Close size={4} viewBox="0 0 24 24" />
						</span>
					)}
				</Button>
			))}

			{/* Subcategory filters */}
			{filters.subcategory_keys.map((key) => (
				<Button
					key={`subcategory-${key}`}
					variant="tag"
					size="tag"
					className={showRemove ? "bg-neutral-80 text-white" : ""}
					onClick={showRemove ? () => onRemoveSubcategory?.(key) : undefined}
				>
					{getSubcategoryName(key)}
					{showRemove && (
						<span className="ml-0 w-full">
							<Close size={4} viewBox="0 0 24 24" />
						</span>
					)}
				</Button>
			))}
		</div>
	);
}
