"use client";

import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { useAccountStore } from "@/lib/store/accountStore";
import type { User } from "@/types/user";

export function UsersTable() {
	const users = useAccountStore((state) => state.users);

	const tableConfig: DataTableConfig<User> = {
		columns: [
			{
				key: "email",
				label: "Email",
				sortable: true,
				getValue: (row) => row.email,
			},
			{
				key: "role",
				label: "Role",
				sortable: true,
				getValue: (row) => row.role?.name ?? "",
				render: (row) => (
					<span className="capitalize">{row.role?.name ?? "—"}</span>
				),
			},
			{
				key: "groups",
				label: "Gruppen",
				sortable: true,
				compare: (a, b) => {
					if (a.groups.length !== b.groups.length) {
						return a.groups.length - b.groups.length;
					}
					if (a.groups.length > 0 && b.groups.length > 0) {
						return a.groups[0].name.localeCompare(b.groups[0].name);
					}
					return 0;
				},
				render: (row) => (
					<div className="flex flex-wrap gap-1">
						{row.groups.length > 0 ? (
							row.groups.map((group) => (
								<Badge key={group.id} variant="secondary" className="text-xs">
									{group.name}
								</Badge>
							))
						) : (
							<span className="text-muted-foreground">—</span>
						)}
					</div>
				),
			},
			{
				key: "status",
				label: "Status",
				sortable: true,
				getValue: (row) => row.status,
				render: (row) => {
					let variant: "default" | "secondary" | "outline" = "outline";
					if (row.status === "active") variant = "default";
					if (row.status === "inactive") variant = "secondary";
					return <Badge variant={variant}>{row.status}</Badge>;
				},
			},
			{
				key: "access",
				label: "Institution Access",
				sortable: true,
				compare: (a, b) =>
					(a.institutions?.length ?? 0) - (b.institutions?.length ?? 0),
				render: (row) => (
					<div className="flex flex-col gap-1">
						<span className="text-sm">
							{row.institutions?.length ?? 0} institutions
						</span>
					</div>
				),
			},
		],
		data: users,
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: "Search users...",
		getSearchableValues: (row) => [
			row.email,
			row.role?.name ?? "",
			row.status,
			...row.groups.map((group) => group.name),
		],
		addButton: {
			label: "Add User",
			onClick: () => {},
		},
		onEdit: () => {},
		emptyMessage: "No users found.",
	};

	return (
		<>
			<DataTable config={tableConfig} />
		</>
	);
}
