"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { useAccountStore } from "@/lib/store/accountStore";
import type { Institution } from "@/types/institution";

export function AccountInstitutionsTable() {
	const router = useRouter();
	const institutions = useAccountStore((state) => state.institutions);

	const tableConfig: DataTableConfig<Institution> = {
		columns: [
			{
				key: "name",
				label: "Name",
				sortable: true,
				getValue: (row) => row.name,
			},
			{
				key: "type",
				label: "Type",
				sortable: true,
				getValue: (row) => row.categories[0]?.key || "",
				render: (row) => (
					<span className="capitalize">{row.categories[0]?.key || ""}</span>
				),
			},
			{
				key: "status",
				label: "Status",
				sortable: true,
				getValue: (row) => row.status,
				render: (row) => {
					let variant: "default" | "secondary" | "outline" = "default";
					if (row.status === "public") variant = "secondary";
					if (row.status === "private") variant = "outline";
					return <Badge variant={variant}>{row.status}</Badge>;
				},
			},
			{
				key: "city",
				label: "City",
				sortable: true,
				accessor: "address.city",
			},
			{
				key: "owner",
				label: "Owner",
				sortable: true,
				getValue: (row) => row.owner_name || "",
				render: (row) =>
					row.owner_name || <span className="text-foreground">—</span>,
			},
			{
				key: "createdAt",
				label: "Created",
				sortable: true,
				getValue: (row) => row.created_at,
			},
			{
				key: "updatedAt",
				label: "Updated",
				sortable: true,
				getValue: (row) => row.updated_at,
			},
		],
		data: institutions,
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: "Search institutions...",
		getSearchableValues: (row) => [
			row.name,
			row.status,
			row.address?.city || "",
			row.address?.district || "",
			row.address?.street || "",
			row.contact_person?.first_name || "",
			row.contact_person?.email || "",
			row.owner_name || "",
		],
		primaryButton: {
			label: "Add Institution",
			onClick: () => router.push("/create"),
		},
		onEdit: () => {},
		emptyMessage: "No institutions found.",
	};

	return <DataTable config={tableConfig} />;
}
