"use client";

import { MultiSelect } from "@/components/shared/MultiSelect";
import type { MultiSelectOption } from "@/components/shared/MultiSelect";
import type { SubcategoryAccess } from "./types";

interface SubcategorySelectorProps {
	availableSubcategories: MultiSelectOption[];
	selectedSubcategories: SubcategoryAccess[];
	onChange: (subcategories: SubcategoryAccess[]) => void;
	getCategoryKey?: (subKey: string) => string | undefined;
}

export function SubcategorySelector({
	availableSubcategories,
	selectedSubcategories,
	onChange,
	getCategoryKey,
}: SubcategorySelectorProps) {
	const selectedKeys = selectedSubcategories.map((sub) => sub.key);

	const handleChange = (selected: string[]) => {
		const nextSubcategories: SubcategoryAccess[] = selected.map((key) => {
			const existing = selectedSubcategories.find((sub) => sub.key === key);
			if (existing) return existing;

			const option = availableSubcategories.find((sub) => sub.value === key);
			const categoryKey = getCategoryKey?.(key) || "";
			const [, subName] = (option?.label || key).split(" — ");
			return {
				key,
				name: subName || option?.label || key,
				categoryKey,
			};
		});
		onChange(nextSubcategories);
	};

	return (
		<MultiSelect
			options={availableSubcategories}
			selected={selectedKeys}
			onChange={handleChange}
			placeholder="Select subcategories..."
			searchPlaceholder="Search subcategories..."
			emptyText="No subcategories found"
		/>
	);
}
