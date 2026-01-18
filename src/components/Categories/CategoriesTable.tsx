"use client";

import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { useAccountStore } from "@/lib/store/accountStore";
import { StatusDot } from "@/components/ui/status-dot";
import type { Category } from "@/types";
import { useTranslation } from "react-i18next";

export function CategoriesTable() {
	const { t: tEnum } = useTranslation("enumMap");
	const categories = useAccountStore((state) => state.categories);
	const parentCategories = categories
		.filter((category) => !category.parent_category_id)
		.map((category) => {
			return {
				...category,
				key: tEnum("category." + category.key),
			};
		});
	const getChildCategories = (parentId: number) =>
		categories.filter((category) => category.parent_category_id === parentId);

	const tableConfig: DataTableConfig<Category> = {
		columns: [
			{
				accessorKey: "status",
				header: "Status",
				meta: { pin: "left" },
				size: 40,
				enableSorting: true,
				cell: ({ row }) => {
					const category = row.original;
					let tone: "success" | "info" | "warning" | "error" | "neutral" =
						"neutral";
					if (category.status === "active") tone = "success";
					if (category.status === "inactive") tone = "neutral";
					return (
						<StatusDot tone={tone} label={category.status} showLabel="hover" />
					);
				},
			},
			{
				accessorKey: "key",
				header: "Key",
				enableSorting: true,
				meta: { pin: "left", truncate: true },
			},
			{
				id: "description",
				header: "Description",
				accessorFn: (row) => row.description ?? "",
				enableSorting: true,
				meta: { truncate: true },
				cell: ({ row }) => row.original.description ?? "—",
			},
			{
				id: "parent",
				header: "Parent",
				accessorFn: (row) => {
					if (!row.parent_category_id) return "";
					return (
						categories.find((cat) => cat.id === row.parent_category_id)?.key ??
						""
					);
				},
				enableSorting: true,
				meta: { truncate: true },
				cell: ({ row }) => {
					if (!row.original.parent_category_id) return "—";
					return (
						categories.find((cat) => cat.id === row.original.parent_category_id)
							?.key ?? "—"
					);
				},
			},
			{
				id: "children",
				header: "Subcategories",
				accessorFn: (row) => getChildCategories(row.id).length,
				enableSorting: true,
				cell: ({ row }) => (
					<span className="body3">
						{getChildCategories(row.original.id).length}
					</span>
				),
			},
		],
		data: parentCategories,
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
			...getChildCategories(row.id).map((child) => child.key),
		],
		getRowCanExpand: (row) => getChildCategories(row.id).length > 0,
		renderExpandedRow: (row) => (
			<div className="flex flex-wrap gap-2 p-3">
				{getChildCategories(row.id).map((child) => (
					<Badge key={child.id} variant="secondary">
						{tEnum("subcategory." + child.key)}
					</Badge>
				))}
			</div>
		),
		primaryButton: undefined,
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
