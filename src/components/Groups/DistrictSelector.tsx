"use client";

import { MultiSelect } from "@/components/shared/MultiSelect";
import type { MultiSelectOption } from "@/components/shared/MultiSelect";
import type { DistrictAccess } from "./types";

// Berlin districts
const availableDistricts: MultiSelectOption[] = [
	{ value: "mitte", label: "Mitte" },
	{ value: "friedrichshain-kreuzberg", label: "Friedrichshain-Kreuzberg" },
	{ value: "pankow", label: "Pankow" },
	{ value: "charlottenburg-wilmersdorf", label: "Charlottenburg-Wilmersdorf" },
	{ value: "spandau", label: "Spandau" },
	{ value: "steglitz-zehlendorf", label: "Steglitz-Zehlendorf" },
	{ value: "tempelhof-schoneberg", label: "Tempelhof-Schöneberg" },
	{ value: "neukolln", label: "Neukölln" },
	{ value: "treptow-kopenick", label: "Treptow-Köpenick" },
	{ value: "marzahn-hellersdorf", label: "Marzahn-Hellersdorf" },
	{ value: "lichtenberg", label: "Lichtenberg" },
	{ value: "reinickendorf", label: "Reinickendorf" },
];

interface DistrictSelectorProps {
	selectedDistricts: DistrictAccess[];
	onChange: (districts: DistrictAccess[]) => void;
}

export function DistrictSelector({
	selectedDistricts,
	onChange,
}: DistrictSelectorProps) {
	const selectedKeys = selectedDistricts.map((d) => d.key);

	const handleChange = (selected: string[]) => {
		const districts: DistrictAccess[] = selected.map((key) => {
			const existing = selectedDistricts.find((d) => d.key === key);
			if (existing) return existing;

			const option = availableDistricts.find((d) => d.value === key);
			return {
				key,
				name: option?.label || key,
			};
		});
		onChange(districts);
	};

	return (
		<MultiSelect
			options={availableDistricts}
			selected={selectedKeys}
			onChange={handleChange}
			placeholder="Select districts..."
			searchPlaceholder="Search districts..."
			emptyText="No districts found"
		/>
	);
}
