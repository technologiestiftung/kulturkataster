"use client";

import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useAccountStore } from "@/lib/store/accountStore";
import { StatusDot } from "@/components/ui/status-dot";
import type { Category } from "@/types";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { EmptyActionState } from "@/components/EmptyActionState";
import Plus from "@/icons/plus.svg";

export function CategoriesTable() {
	const { t: tEnum } = useTranslation("enumMap");
	const { t } = useTranslation(["content", "common"]);
	const router = useRouter();
	const toLocalePath = useLocalePath();
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

	const parentCategoriesById = useMemo(() => {
		return new Map(categories.map((category) => [category.id, category.key]));
	}, [categories]);

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
				header: t("categoryTable.columns.parent", { defaultValue: "Parent" }),
				accessorFn: (row) => {
					if (!row.parent_category_id) return "";
					return parentCategoriesById.get(row.parent_category_id) ?? "";
				},
				enableSorting: true,
				meta: { truncate: true },
				cell: ({ row }) => {
					if (!row.original.parent_category_id) return "—";
					return (
						parentCategoriesById.get(row.original.parent_category_id) ?? "—"
					);
				},
			},
			{
				id: "children",
				header: t("categoryTable.columns.subcategories", {
					defaultValue: "Subcategories",
				}),
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
		primaryButton: {
			label: t("categoryTable.actions.add", { defaultValue: "Add category" }),
			onClick: () => router.push(toLocalePath("/account/categories/new")),
		},
		emptyState: (
			<EmptyActionState
				title={t("categoryTable.empty.title", {
					defaultValue: "Keine Kategorien gefunden.",
				})}
				description={t("categoryTable.empty.description", {
					defaultValue:
						"Erstellen Sie eine Kategorie, um Inhalte besser zu strukturieren.",
				})}
				actions={[
					{
						icon: <Plus className="size-5" />,
						label: t("categoryTable.actions.add", {
							defaultValue: "Add category",
						}),
						href: toLocalePath("/account/categories/new"),
					},
				]}
			/>
		),
		onEdit: (row) =>
			router.push(toLocalePath(`/account/categories/${row.id}/edit`)),
		emptyMessage: t("categoryTable.emptyMessage", {
			defaultValue: "No categories found.",
		}),
		title: t("categoryTable.title", { defaultValue: "Categories" }),
		subtitle: t("categoryTable.subtitle", {
			defaultValue: `${categories.length} ${
				categories.length === 1 ? "category" : "categories"
			} total`,
			count: categories.length,
		}),
	};

	return (
		<>
			<DataTable config={tableConfig} />
		</>
	);
}
