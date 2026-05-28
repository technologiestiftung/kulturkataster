"use client";

import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useAccountStore } from "@/lib/store/accountStore";
import type { Group } from "@/types/group";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { EmptyActionState } from "@/components/EmptyActionState";
import Plus from "@/icons/plus.svg";

export function GroupsTable() {
	const groups = useAccountStore((state) => state.groups);
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const { t } = useTranslation();

	const tableConfig: DataTableConfig<Group> = {
		columns: [
			{
				accessorKey: "name",
				header: t("content.groupTable.columns.name"),
				enableSorting: true,
				meta: { pin: "left", truncate: true },
			},
			{
				accessorKey: "description",
				header: t("content.groupTable.columns.description"),
				enableSorting: true,
				meta: { truncate: true },
			},
			{
				id: "userCount",
				header: t("content.groupTable.columns.users"),
				accessorFn: (row) => row.users?.length ?? 0,
				enableSorting: true,
			},
			{
				id: "institutionCount",
				header: t("content.groupTable.columns.institutions"),
				accessorFn: (row) => row.institutions?.length ?? 0,
				enableSorting: true,
			},
			{
				accessorKey: "updated_at",
				header: t("content.groupTable.columns.updated"),
				enableSorting: true,
				cell: ({ row }) => {
					const group = row.original;
					return new Date(group.updated_at)?.toLocaleDateString();
				},
			},
			{
				accessorKey: "created_at",
				header: t("content.groupTable.columns.created"),
				enableSorting: true,
				cell: ({ row }) => {
					const group = row.original;
					return new Date(group.created_at)?.toLocaleDateString();
				},
			},
		],

		data: groups,
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: t("content.groupTable.searchPlaceholder"),
		getSearchableValues: (row) => [
			row.name,
			row.description ?? "",
			String(row.users?.length ?? 0),
			String(row.institutions?.length ?? 0),
			row.created_at.toLocaleDateString(),
		],

		primaryButton: {
			label: t("content.groupTable.actions.add"),
			onClick: () => router.push(toLocalePath("/account/groups/new")),
		},
		emptyState: (
			<EmptyActionState
				title={t("content.groupTable.empty.title", {
					defaultValue: "Keine Gruppen gefunden.",
				})}
				description={t("content.groupTable.empty.description", {
					defaultValue:
						"Erstellen Sie eine Gruppe, um Mitglieder zu organisieren.",
				})}
				actions={[
					{
						icon: <Plus className="size-5" />,
						label: t("content.groupTable.actions.add"),
						href: toLocalePath("/account/groups/new"),
					},
				]}
			/>
		),

		onEdit: (row) =>
			router.push(toLocalePath(`/account/groups/${row.id}/edit`)),
		onEditPrefetch: (row) => {
			void router.prefetch(toLocalePath(`/account/groups/${row.id}/edit`));
		},
		emptyMessage: t("content.groupTable.emptyMessage"),
	};

	return (
		<>
			<DataTable config={tableConfig} />
		</>
	);
}
