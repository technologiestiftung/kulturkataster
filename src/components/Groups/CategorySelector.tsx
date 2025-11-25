"use client";

import { MultiSelect } from "@/components/shared/MultiSelect";
import type { CategoryAccess } from "./types";

interface CategorySelectorProps {
	selectedCategories: CategoryAccess[];
	onChange: (categories: CategoryAccess[]) => void;
	options?: { value: string; label: string }[];
}

export function CategorySelector({
	selectedCategories,
	onChange,
	options,
}: CategorySelectorProps) {
	const availableCategories = options || [];
	const selectedKeys = selectedCategories.map((c) => c.key);

	const handleChange = (selected: string[]) => {
		const categories: CategoryAccess[] = selected.map((key) => {
			const existing = selectedCategories.find((c) => c.key === key);
			if (existing) return existing;

			const option = availableCategories.find((c) => c.value === key);
			return {
				key,
				name: option?.label || key,
			};
		});
		onChange(categories);
	};

	return (
		<MultiSelect
			options={availableCategories}
			selected={selectedKeys}
			onChange={handleChange}
			placeholder="Select categories..."
			searchPlaceholder="Search categories..."
			emptyText="No categories found"
		/>
	);
}
