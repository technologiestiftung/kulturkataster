"use client";

import { SearchableSelect } from "@/components/shared/SearchableSelect";
import type { SearchableSelectOption } from "@/components/shared/SearchableSelect";
import type { Group } from "./types";

// Sample groups data (in real app, this would come from API/props)
const availableGroups: SearchableSelectOption[] = [
	{ value: "g1", label: "Admin" },
	{ value: "g2", label: "Open Spaces" },
	{ value: "g3", label: "Custom District" },
	{ value: "g4", label: "Redaktion" },
	{ value: "g5", label: "Museums" },
	{ value: "g6", label: "Theaters" },
	{ value: "g7", label: "Libraries" },
];

interface GroupSelectorProps {
	selectedGroups: Group[];
	onChange: (groups: Group[]) => void;
}

export function GroupSelector({
	selectedGroups,
	onChange,
}: GroupSelectorProps) {
	const selectedIds = selectedGroups.map((g) => g.id);

	const handleChange = (selected: string[]) => {
		const groups: Group[] = selected.map((id) => {
			const existing = selectedGroups.find((g) => g.id === id);
			if (existing) return existing;

			const option = availableGroups.find((g) => g.value === id);
			return {
				id,
				name: option?.label || id,
			};
		});
		onChange(groups);
	};

	return (
		<SearchableSelect
			options={availableGroups}
			selected={selectedIds}
			onChange={handleChange}
			placeholder="Search groups..."
			searchPlaceholder="Type group name..."
			emptyText="No groups found"
			allowMultiple
			previewCount={3}
		/>
	);
}
