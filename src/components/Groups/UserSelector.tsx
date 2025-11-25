"use client";

import { SearchableSelect } from "@/components/shared/SearchableSelect";
import type { SearchableSelectOption } from "@/components/shared/SearchableSelect";

// Sample users data (in real app, this would come from API/props)
const availableUsers: SearchableSelectOption[] = [
	{
		value: "1",
		label: "Max Mustermann",
		description: "max.mustermann@example.com",
	},
	{
		value: "2",
		label: "Anna Schmidt",
		description: "anna.schmidt@example.com",
	},
	{
		value: "3",
		label: "Peter Mueller",
		description: "peter.mueller@example.com",
	},
	{ value: "4", label: "Lisa Weber", description: "lisa.weber@example.com" },
	{ value: "5", label: "Tom Fischer", description: "tom.fischer@example.com" },
	{ value: "6", label: "Sarah Koch", description: "sarah.koch@example.com" },
	{
		value: "7",
		label: "Michael Becker",
		description: "michael.becker@example.com",
	},
	{
		value: "8",
		label: "Julia Hoffmann",
		description: "julia.hoffmann@example.com",
	},
	{
		value: "9",
		label: "Stefan Werner",
		description: "stefan.werner@example.com",
	},
	{
		value: "10",
		label: "Katharina Schulz",
		description: "katharina.schulz@example.com",
	},
	{
		value: "11",
		label: "Martin Richter",
		description: "martin.richter@example.com",
	},
];

interface UserSelectorProps {
	selectedUserIds: string[];
	onChange: (userIds: string[]) => void;
}

export function UserSelector({ selectedUserIds, onChange }: UserSelectorProps) {
	return (
		<SearchableSelect
			options={availableUsers}
			selected={selectedUserIds}
			onChange={onChange}
			placeholder="Search users..."
			searchPlaceholder="Type user name or email..."
			emptyText="No users found"
			allowMultiple={true}
			previewCount={3}
		/>
	);
}
