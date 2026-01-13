"use client";

import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { useAccountStore } from "@/lib/store/accountStore";
import type { Role } from "@/types/role";

export function RolesTable() {
	const roles = useAccountStore((state) => state.roles);

	const tableConfig: DataTableConfig<Role> = {
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
				getValue: (row) => row.users.length,
			},
		],
		data: roles,
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: "Search roles...",
		getSearchableValues: (row) => {
			const values: string[] = [
				row.name,
				row.description ?? "",
				String(row.users.length),
			];

			return values;
		},
		primaryButton: {
			label: "Create Role",
			onClick: () => {},
		},
		onEdit: () => {},
		emptyMessage: "No roles found.",
		title: "Roles",
		subtitle: `${roles.length} ${roles.length === 1 ? "role" : "roles"} total`,
	};

	return (
		<>
			<DataTable config={tableConfig} />
		</>
	);
}
