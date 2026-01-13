"use client";

import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { useAccountStore } from "@/lib/store/accountStore";
import type { Group } from "@/types/group";

export function GroupsTable() {
	const groups = useAccountStore((state) => state.groups);

	const tableConfig: DataTableConfig<Group> = {
		columns: [
			{
				key: "name",
				label: "Name",
				sortable: true,
				getValue: (row) => row.name,
			},
			{
				key: "description",
				label: "Description",
				sortable: true,
				getValue: (row) => row.description,
			},
			{
				key: "userCount",
				label: "Users",
				sortable: true,
				getValue: (row) => row.users?.length,
			},
			{
				key: "institutionCount",
				label: "Institutions",
				sortable: true,
				getValue: (row) => row.institutions?.length,
			},
			{
				key: "createdAt",
				label: "Created",
				sortable: true,
				getValue: (row) => row.created_at,
			},
		],
		data: groups,
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: "Search groups...",
		getSearchableValues: (row) => [
			row.name,
			row.description ?? "",
			String(row.users?.length ?? 0),
			String(row.institutions?.length ?? 0),
			row.created_at.toLocaleDateString(),
		],
		primaryButton: {
			label: "Create Group",
			onClick: () => {},
		},
		onEdit: () => {},
		emptyMessage: "No groups found.",
		title: "Groups",
		subtitle: `${groups.length} ${groups.length === 1 ? "group" : "groups"} total`,
	};

	return (
		<>
			<DataTable config={tableConfig} />
		</>
	);
}
