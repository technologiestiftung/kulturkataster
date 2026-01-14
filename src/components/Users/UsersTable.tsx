"use client";

import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { useAccountStore } from "@/lib/store/accountStore";
import type { User } from "@/types/user";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export function UsersTable() {
	const users = useAccountStore((state) => state.users);
	const router = useRouter();
	const { t } = useTranslation("content");

	const getStatusLabel = (status: User["status"]) => {
		if (status === "approval_pending") {
			return t("userFormModal.status.approvalPending");
		}
		if (status === "active") return t("userFormModal.status.active");
		if (status === "inactive") return t("userFormModal.status.inactive");
		if (status === "banned") return t("userFormModal.status.banned");
		return status;
	};

	const tableConfig: DataTableConfig<User> = {
		columns: [
			{
				key: "email",
				label: t("userTable.columns.email"),
				sortable: true,
				getValue: (row) => row.email,
			},
			{
				key: "first_name",
				label: t("userTable.columns.firstName"),
				sortable: true,
				getValue: (row) => row.first_name,
			},
			{
				key: "last_name",
				label: t("userTable.columns.lastName"),
				sortable: true,
				getValue: (row) => row.last_name,
			},
			{
				key: "role",
				label: t("userTable.columns.role"),
				sortable: true,
				getValue: (row) => row.role?.name ?? "",
				render: (row) => (
					<span className="capitalize">
						{row.role?.name ?? t("userTable.emptyValue")}
					</span>
				),
			},
			{
				key: "groups",
				label: t("userTable.columns.groups"),
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
							<span className="text-foreground">
								{t("userTable.emptyValue")}
							</span>
						)}
					</div>
				),
			},
			{
				key: "status",
				label: t("userTable.columns.status"),
				sortable: true,
				getValue: (row) => row.status,
				render: (row) => {
					let variant: "default" | "secondary" | "outline" = "outline";
					if (row.status === "active") variant = "default";
					if (row.status === "inactive") variant = "secondary";
					return <Badge variant={variant}>{getStatusLabel(row.status)}</Badge>;
				},
			},
			{
				key: "access",
				label: t("userTable.columns.access"),
				sortable: true,
				compare: (a, b) =>
					(a.institutions?.length ?? 0) - (b.institutions?.length ?? 0),
				render: (row) => (
					<div className="flex flex-col gap-1">
						<span className="body3">
							{t("userTable.institutionsCount", {
								count: row.institutions?.length ?? 0,
							})}
						</span>
					</div>
				),
			},
			{
				key: "compliance",
				label: t("userTable.columns.compliance"),
				sortable: true,
				compare: (a, b) => Number(b.compliance) - Number(a.compliance),
				render: (row) => (
					<div className="flex flex-col gap-1">
						{row.compliance ? (
							<Badge variant="default" className="text-xs">
								{t("userTable.compliance.accepted")}
							</Badge>
						) : (
							<Badge variant="outline" className="text-xs">
								{t("userTable.compliance.rejected")}
							</Badge>
						)}
					</div>
				),
			},
		],
		data: users,
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: t("userTable.searchPlaceholder"),
		getSearchableValues: (row) => [
			row.email,
			row.role?.name ?? "",
			row.status,
			...row.groups.map((group) => group.name),
		],
		primaryButton: {
			label: t("userTable.actions.add"),
			onClick: () => router.push("/account/users/new"),
		},
		secondaryButton: {
			label: t("userTable.actions.cancel"),
			onClick: () => router.push("/account/users"),
		},
		onEdit: (row) => router.push(`/account/users/${row.id}/edit`),
		emptyMessage: t("userTable.emptyMessage"),
	};

	return (
		<>
			<DataTable config={tableConfig} />
		</>
	);
}
