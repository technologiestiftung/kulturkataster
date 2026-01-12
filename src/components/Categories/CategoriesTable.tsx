"use client";

import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { useAccountStore } from "@/lib/store/accountStore";
import type { Category } from "@/types";

export function CategoriesTable() {
	const categories = useAccountStore((state) => state.categories);

	const tableConfig: DataTableConfig<Category> = {
		columns: [
			{
				key: "key",
				label: "Key",
				sortable: true,
				getValue: (row) => row.key,
			},
			{
				key: "description",
				label: "Description",
				sortable: true,
				getValue: (row) => row.description ?? "",
				render: (row) => row.description ?? "—",
			},
			{
				key: "parent",
				label: "Parent",
				sortable: true,
				getValue: (row) => {
					if (!row.parent_category_id) return "";
					return (
						categories.find((cat) => cat.id === row.parent_category_id)?.key ??
						""
					);
				},
				render: (row) => {
					if (!row.parent_category_id) return "—";
					return (
						categories.find((cat) => cat.id === row.parent_category_id)?.key ??
						"—"
					);
				},
			},
			{
				key: "children",
				label: "Subcategories",
				sortable: true,
				getValue: (row) => row.subcategory?.length ?? 0,
				render: (row) => (
					<span className="text-sm">{row.subcategory?.length ?? 0}</span>
				),
			},
			{
				key: "status",
				label: "Status",
				sortable: true,
				getValue: (row) => row.status ?? "",
				render: (row) => {
					let variant: "default" | "secondary" | "outline" = "outline";
					if (row.status === "active") variant = "default";
					if (row.status === "inactive") variant = "secondary";
					return <Badge variant={variant}>{row.status}</Badge>;
				},
			},
		],
		data: categories,
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: "Search categories...",
		getSearchableValues: (row) => [
			row.key,
			row.description ?? "",
			row.status ?? "",
			(row.parent_category_id &&
				categories.find((cat) => cat.id === row.parent_category_id)?.key) ||
				"",
			...(row.subcategory ?? []).map((child) => child.key),
		],
		addButton: undefined,
		onEdit: undefined,
		emptyMessage: "No categories found.",
		title: "Categories",
		subtitle: `${categories.length} ${
			categories.length === 1 ? "category" : "categories"
		} total`,
	};

	return (
		<>
			<DataTable config={tableConfig} />
		</>
	);
}
