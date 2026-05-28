"use client";

import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useAccountStore } from "@/lib/store/accountStore";
import { StatusDot } from "@/components/ui/status-dot";
import { type Category } from "@/types";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { EmptyActionState } from "@/components/EmptyActionState";
import Plus from "@/icons/plus.svg";
import Edit from "@/icons/edit.svg";
import { CategoryIcon } from "@/components/shared/CategoryIcon";
import { CategoryStatus } from "@/generated/prisma";

type CategoryTableRow = Category & {
	rowKind: "parent" | "child";
	displayKey: string;
	parentDisplay: string;
	childRows: CategoryTableRow[];
};

export function CategoriesTable() {
	const { t: tEnum } = useTranslation();
	const { t } = useTranslation();
	const router = useRouter();
	const toLocalePath = useLocalePath();

	const getStatusLabel = (status: CategoryStatus | undefined) => {
		if (status === "active")
			return t("content.categoryFormModal.status.active");
		if (status === "inactive")
			return t("content.categoryFormModal.status.inactive");
		return status ?? "";
	};
	const categories = useAccountStore((state) => state.categories);

	const childCategoriesByParentId = useMemo(() => {
		const grouped = new Map<number, Category[]>();
		for (const category of categories) {
			if (!category.parent_category_id) continue;
			const current = grouped.get(category.parent_category_id) ?? [];
			current.push(category);
			grouped.set(category.parent_category_id, current);
		}
		return grouped;
	}, [categories]);

	const parentRows = useMemo<CategoryTableRow[]>(() => {
		const toParentKey = (key: string) =>
			tEnum(`enumMap.category.${key}`, { defaultValue: key });
		const toChildKey = (key: string) =>
			tEnum(`enumMap.category.${key}`, { defaultValue: key });
		return categories
			.filter((category) => !category.parent_category_id)
			.map((parent) => {
				const childRows: CategoryTableRow[] = (
					childCategoriesByParentId.get(parent.id) ?? []
				).map((child) => ({
					...child,
					rowKind: "child",
					displayKey: toChildKey(child.key),
					parentDisplay: toParentKey(parent.key),
					childRows: [],
				}));
				return {
					...parent,
					rowKind: "parent",
					displayKey: toParentKey(parent.key),
					parentDisplay: "",
					childRows,
				};
			});
	}, [categories, childCategoriesByParentId, tEnum]);

	const tableConfig: DataTableConfig<CategoryTableRow> = {
		columns: [
			{
				accessorKey: "status",
				meta: { pin: "left" },
				header: "",
				size: 27,
				enableSorting: true,
				cell: ({ row }) => {
					const category = row.original;
					let tone: "success" | "info" | "warning" | "error" | "neutral" =
						"neutral";
					if (category.status === "active") tone = "success";
					if (category.status === "inactive") tone = "error";

					return (
						<StatusDot
							tone={tone}
							label={getStatusLabel(category.status)}
							showLabel="hover"
						/>
					);
				},
			},
			{
				id: "icon",
				header: t("content.categoryTable.columns.icon"),
				enableSorting: false,
				size: 31,
				meta: { pin: "left" },
				cell: ({ row }) => (
					<CategoryIcon
						iconUrl={row.original.icon}
						categoryKey={row.original.key}
						className="h-6 w-6"
					/>
				),
			},
			{
				accessorKey: "displayKey",
				header: t("content.categoryTable.columns.key"),
				enableSorting: true,
				size: 180,
				meta: { pin: "left", truncate: true },
				cell: ({ row }) => (
					<span className="inline-flex items-center gap-2">
						{row.original.displayKey}
					</span>
				),
			},
			{
				id: "description",
				header: t("content.categoryTable.columns.description"),
				accessorFn: (row) => row.description ?? "",
				enableSorting: true,
				meta: { truncate: true },
				cell: ({ row }) => row.original.description ?? "—",
			},
			{
				id: "parent",
				header: t("content.categoryTable.columns.parent", {
					defaultValue: "Parent",
				}),
				accessorFn: (row) => row.parentDisplay,
				enableSorting: true,
				meta: { truncate: true },
				cell: ({ row }) => row.original.parentDisplay || "—",
			},
			{
				id: "children",
				header: t("content.categoryTable.columns.subcategories", {
					defaultValue: "Subcategories",
				}),
				accessorFn: (row) => row.childRows.length,
				enableSorting: true,
				cell: ({ row }) => (
					<span className="body3">{row.original.childRows.length}</span>
				),
			},
		],

		data: parentRows,
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: t("content.categoryTable.searchPlaceholder"),
		getSearchableValues: (row) => [
			row.displayKey,
			row.description ?? "",
			row.status ?? "",
			row.parentDisplay,
			...row.childRows.flatMap((child) => [
				child.displayKey,
				child.description ?? "",
			]),
		],

		getRowCanExpand: (row) => row.childRows.length > 0,
		renderExpandedRow: (row) => (
			<div className="px-4 py-2">
				{row.childRows.map((child) => {
					let tone: "success" | "info" | "warning" | "error" | "neutral" =
						"neutral";
					if (child.status === "active") tone = "success";
					if (child.status === "inactive") tone = "neutral";
					return (
						<div
							key={child.id}
							className="grid grid-cols-12 items-center gap-3 border-b border-neutral-20 py-3 last:border-b-0"
						>
							<div className="col-span-1">
								<StatusDot tone={tone} label={child.status} showLabel="hover" />
							</div>
							<div className="col-span-3 body3 font-semibold truncate">
								<span className="mr-2 text-neutral-60">↳</span>
								{child.displayKey}
							</div>
							<div className="col-span-4 body3 truncate">
								{child.description ?? "—"}
							</div>
							<div className="col-span-2 body3 truncate">
								{child.parentDisplay || "—"}
							</div>
							<div className="col-span-2 flex justify-end">
								<Button
									type="button"
									variant="surface"
									radius="full"
									iconSize="sm"
									onClick={() =>
										router.push(
											toLocalePath(`/account/categories/${child.id}/edit`),
										)
									}
									aria-label={t(
										"content.categoryTable.actions.editSubcategory",
										{
											defaultValue: "Unterkategorie bearbeiten",
										},
									)}
								>
									<Edit className="h-5 w-5 text-neutral-80" />
								</Button>
							</div>
						</div>
					);
				})}
			</div>
		),

		primaryButton: {
			label: t("content.categoryTable.actions.add", {
				defaultValue: "Add category",
			}),
			onClick: () => router.push(toLocalePath("/account/categories/new")),
		},
		emptyState: (
			<EmptyActionState
				title={t("content.categoryTable.empty.title", {
					defaultValue: "Keine Kategorien gefunden.",
				})}
				description={t("content.categoryTable.empty.description", {
					defaultValue:
						"Erstellen Sie eine Kategorie, um Inhalte besser zu strukturieren.",
				})}
				actions={[
					{
						icon: <Plus className="size-5" />,
						label: t("content.categoryTable.actions.add", {
							defaultValue: "Add category",
						}),
						href: toLocalePath("/account/categories/new"),
					},
				]}
			/>
		),

		onEdit: (row) =>
			router.push(toLocalePath(`/account/categories/${row.id}/edit`)),
		onEditPrefetch: (row) => {
			void router.prefetch(toLocalePath(`/account/categories/${row.id}/edit`));
		},
		emptyMessage: t("content.categoryTable.emptyMessage", {
			defaultValue: "No categories found.",
		}),
	};

	return (
		<>
			<DataTable config={tableConfig} />
		</>
	);
}
