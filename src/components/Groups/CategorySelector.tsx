"use client";

import { MultiSelect } from "@/components/shared/MultiSelect";
import type { MultiSelectOption } from "@/components/shared/MultiSelect";
import type { CategoryAccess } from "./types";

// Cultural institution categories
const availableCategories: MultiSelectOption[] = [
	{ value: "museums", label: "Museums" },
	{ value: "theaters", label: "Theaters & Performance" },
	{ value: "libraries", label: "Libraries & Archives" },
	{ value: "galleries", label: "Art Galleries" },
	{ value: "music-venues", label: "Music Venues" },
	{ value: "cinemas", label: "Cinemas" },
	{ value: "cultural-centers", label: "Cultural Centers" },
	{ value: "parks", label: "Parks & Gardens" },
	{ value: "plazas", label: "Public Plazas" },
	{ value: "historical-sites", label: "Historical Sites" },
	{ value: "community-centers", label: "Community Centers" },
	{ value: "educational", label: "Educational Institutions" },
];

interface CategorySelectorProps {
	selectedCategories: CategoryAccess[];
	onChange: (categories: CategoryAccess[]) => void;
}

export function CategorySelector({
	selectedCategories,
	onChange,
}: CategorySelectorProps) {
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
