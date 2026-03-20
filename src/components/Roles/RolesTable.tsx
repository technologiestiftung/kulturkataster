"use client";

import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useAccountStore } from "@/lib/store/accountStore";
import type { Role } from "@/types/role";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { EmptyActionState } from "@/components/EmptyActionState";
import Plus from "@/icons/plus.svg";
import { Badge } from "@/components/ui/badge";

export function RolesTable() {
	const roles = useAccountStore((state) => state.roles);
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const { t } = useTranslation(["content", "enumMap"]);

	const tableConfig: DataTableConfig<Role> = {
		columns: [
			{
				accessorKey: "name",
				header: t("roleTable.columns.name"),
				enableSorting: true,
				meta: { pin: "left", truncate: true },
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<span>{row.original.name}</span>
						{row.original.is_guest ? (
							<Badge variant="default">
								{t("roleTable.badges.guest", { defaultValue: "Guest role" })}
							</Badge>
						) : null}
					</div>
				),
			},
			{
				accessorKey: "description",
				header: t("roleTable.columns.description"),
				enableSorting: true,
				meta: { truncate: true },
			},
			{
				id: "created_at",
				header: t("roleTable.columns.createdAt"),
				accessorFn: (row) => new Date(row.created_at).toLocaleDateString(),
				enableSorting: true,
			},
			{
				id: "updated_at",
				header: t("roleTable.columns.updatedAt"),
				accessorFn: (row) => new Date(row.updated_at).toLocaleDateString(),
				enableSorting: true,
			},
			{
				id: "userCount",
				header: t("roleTable.columns.users"),
				accessorFn: (row) => row.users.length,
				enableSorting: true,
			},
		],
		data: roles,
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: t("roleTable.searchPlaceholder"),
		getSearchableValues: (row) => {
			const values: string[] = [
				row.name,
				row.description ?? "",
				String(row.users.length),
			];

			return values;
		},
		primaryButton: {
			label: t("roleTable.actions.add"),
			onClick: () => router.push(toLocalePath("/account/roles/new")),
		},
		emptyState: (
			<EmptyActionState
				title={t("roleTable.empty.title", {
					defaultValue: "Keine Rollen gefunden.",
				})}
				description={t("roleTable.empty.description", {
					defaultValue:
						"Erstellen Sie eine Rolle, um Berechtigungen zu verwalten.",
				})}
				actions={[
					{
						icon: <Plus className="size-5" />,
						label: t("roleTable.actions.add"),
						href: toLocalePath("/account/roles/new"),
					},
				]}
			/>
		),
		onEdit: (row) => router.push(toLocalePath(`/account/roles/${row.id}/edit`)),
		emptyMessage: t("roleTable.emptyMessage"),
	};

	return (
		<>
			<DataTable config={tableConfig} />
		</>
	);
}
