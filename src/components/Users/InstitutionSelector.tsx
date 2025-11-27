"use client";

import { SearchableSelect } from "@/components/shared/SearchableSelect";
import type { SearchableSelectOption } from "@/components/shared/SearchableSelect";
import type { InstitutionAccess } from "./types";

// Sample institutions data (in real app, this would come from API/props)
export const defaultInstitutionOptions: SearchableSelectOption[] = [
	{
		value: "1",
		label: "Berlinische Galerie",
		description: "Museum of Modern Art",
	},
	{
		value: "2",
		label: "Hamburger Bahnhof",
		description: "Museum for Contemporary Art",
	},
	{
		value: "3",
		label: "KW Institute for Contemporary Art",
		description: "Contemporary Art Space",
	},
	{
		value: "5",
		label: "Museum für Naturkunde",
		description: "Natural History",
	},
	{
		value: "10",
		label: "Kulturbrauerei",
		description: "Cultural Brewery Complex",
	},
	{ value: "11", label: "Pfefferberg Theater", description: "Theater Venue" },
	{ value: "12", label: "Alte Nationalgalerie", description: "Classical Art" },
	{ value: "15", label: "Berlinische Galerie", description: "Art Museum" },
	{
		value: "20",
		label: "Pankow Kulturzentrum",
		description: "Cultural Center",
	},
	{ value: "23", label: "C/O Berlin", description: "Photography Museum" },
	{ value: "30", label: "Schaubühne", description: "Theater" },
	{ value: "31", label: "Radialsystem", description: "Performance Space" },
	{ value: "40", label: "Berghain", description: "Club & Cultural Space" },
	{ value: "41", label: "Gretchen", description: "Club" },
	{ value: "50", label: "Deutsche Oper", description: "Opera House" },
	{ value: "51", label: "Staatsoper", description: "State Opera" },
	{
		value: "60",
		label: "Amerika-Gedenkbibliothek",
		description: "Public Library",
	},
	{ value: "70", label: "Tempodrom", description: "Event Venue" },
];

interface InstitutionSelectorProps {
	selectedInstitutions: InstitutionAccess[];
	onChange: (institutions: InstitutionAccess[]) => void;
	options?: SearchableSelectOption[];
	onSearch?: (term: string) => void;
}

export function InstitutionSelector({
	selectedInstitutions,
	onChange,
	options,
	onSearch,
}: InstitutionSelectorProps) {
	const selectedIds = selectedInstitutions.map((i) => String(i.id));
	const institutionOptions = (options || defaultInstitutionOptions).map(
		(option) => ({
			value:
				typeof option.value === "string"
					? option.value
					: String((option as { value: unknown }).value ?? ""),
			label:
				typeof option.label === "string"
					? option.label
					: String(
							(option as { label?: unknown }).label ??
								(option as { name?: unknown }).name ??
								(option as { value?: unknown }).value ??
								"Institution",
						),
			description:
				typeof option.description === "string" ? option.description : undefined,
		}),
	);

	const handleChange = (selected: string[]) => {
		const institutions: InstitutionAccess[] = selected.map((id) => {
			const existing = selectedInstitutions.find(
				(i) => String(i.id) === String(id),
			);
			if (existing) return existing;

			const option = institutionOptions.find((i) => i.value === id);
			return {
				id: String(id),
				name: option?.label || id,
			};
		});
		onChange(institutions);
	};

	return (
		<SearchableSelect
			options={institutionOptions}
			selected={selectedIds}
			onChange={handleChange}
			placeholder="Search institutions..."
			searchPlaceholder="Type institution name..."
			emptyText="No institutions found"
			allowMultiple={true}
			previewCount={3}
			onSearch={onSearch}
		/>
	);
}
