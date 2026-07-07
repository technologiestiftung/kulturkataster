"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { UserStatus } from "@/generated/prisma";
import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { BadgeOverflowList } from "@/components/Badges/Badges";
import { StatusDot } from "@/components/ui/status-dot";
import { useAccountStore } from "@/lib/store/accountStore";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import type { User } from "@/types/user";
import { UserFilterPanel, type UserFilters } from "./UserFilterPanel";
import { EmptyActionState } from "@/components/EmptyActionState";
import Plus from "@/icons/plus.svg";

const defaultFilters: UserFilters = {
	status: "all",
	role: "all",
	groups: [],
	compliance: "all",
};

export function UsersTable() {
	const users = useAccountStore((state) => state.users);
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const { t } = useTranslation();

	const [filters, setFilters] = useState<UserFilters>(defaultFilters);
	const [draftFilters, setDraftFilters] = useState<UserFilters>(defaultFilters);

	const roleOptions = useMemo(() => {
		const roles = Array.from(
			new Set(users.map((user) => user.role?.name).filter(Boolean) as string[]),
		).sort((a, b) => a.localeCompare(b));
		return [
			{
				label: t("content.userTable.filter.allRoles"),
				value: "all",
			},
			...roles.map((role) => ({ label: role, value: role })),
		];
	}, [t, users]);

	const groupOptions = useMemo(() => {
		const groups = Array.from(
			new Set(
				users
					.flatMap((user) => user.groups.map((group) => group.name))
					.filter(Boolean),
			),
		).sort((a, b) => a.localeCompare(b));
		return groups.map((group) => ({ label: group, value: group }));
	}, [users]);

	const getStatusLabel = (status: UserStatus) => {
		if (status === "approval_pending") {
			return t("content.userFormModal.status.approvalPending");
		}
		if (status === "active") return t("content.userFormModal.status.active");
		if (status === "inactive")
			return t("content.userFormModal.status.inactive");
		if (status === "banned") return t("content.userFormModal.status.banned");
		return status;
	};

	const filteredUsers = useMemo(() => {
		return users.filter((user) => {
			const matchesStatus =
				filters.status === "all" ? true : user.status === filters.status;

			const matchesRole =
				filters.role === "all"
					? true
					: (user.role?.name ?? "") === filters.role;

			const matchesGroups =
				filters.groups.length === 0
					? true
					: filters.groups.some((groupName) =>
							user.groups.some((group) => group.name === groupName),
						);

			let matchesCompliance = true;
			if (filters.compliance === "accepted") {
				matchesCompliance = Boolean(user.compliance);
			} else if (filters.compliance === "rejected") {
				matchesCompliance = !Boolean(user.compliance);
			}

			return matchesStatus && matchesRole && matchesGroups && matchesCompliance;
		});
	}, [filters, users]);

	const tableConfig: DataTableConfig<User> = {
		columns: [
			{
				id: "status",
				header: "",
				accessorKey: "status",
				enableSorting: true,
				meta: { pin: "left" },
				size: 50,
				cell: ({ row }) => {
					const user = row.original;
					let tone: "success" | "neutral" | "info" | "error" = "neutral";
					if (user.status === "active") tone = "success";
					else if (user.status === "approval_pending") tone = "info";
					else if (user.status === "inactive") tone = "error";
					else if (user.status === "banned") tone = "neutral";
					return (
						<StatusDot
							tone={tone}
							label={getStatusLabel(user.status)}
							showLabel="hover"
						/>
					);
				},
			},
			{
				accessorKey: "email",
				header: t("content.userTable.columns.email"),
				enableSorting: true,
				size: 250,
				meta: { pin: "left", truncate: true },
			},
			{
				accessorKey: "first_name",
				header: t("content.userTable.columns.firstName"),
				enableSorting: true,
				meta: { truncate: true },
			},
			{
				accessorKey: "last_name",
				header: t("content.userTable.columns.lastName"),
				enableSorting: true,
				meta: { truncate: true },
			},
			{
				accessorKey: "submissions",
				header: t("content.userTable.columns.claims"),
				enableSorting: true,
				meta: { truncate: true },
				cell: ({ row }) => {
					const claims =
						row.original.submissions?.filter(
							(submission) => submission.type === "claim",
						).length ?? 0;
					return (
						<span>
							{claims > 0
								? row.original.submissions?.length
								: t("content.userTable.emptyValue")}
						</span>
					);
				},
			},
			{
				id: "role",
				header: t("content.userTable.columns.role"),
				accessorFn: (row) => row.role?.name ?? "",
				enableSorting: true,
				meta: { truncate: true },
				cell: ({ row }) => (
					<span className="capitalize">
						{row.original.role?.name ?? t("content.userTable.emptyValue")}
					</span>
				),
			},
			{
				id: "groups",
				header: t("content.userTable.columns.groups"),
				enableSorting: true,
				sortingFn: (rowA, rowB) => {
					const a = rowA.original;
					const b = rowB.original;
					if (a.groups.length !== b.groups.length) {
						return a.groups.length - b.groups.length;
					}
					if (a.groups.length > 0 && b.groups.length > 0) {
						return a.groups[0].name.localeCompare(b.groups[0].name);
					}
					return 0;
				},
				cell: ({ row }) => (
					<BadgeOverflowList
						items={row.original.groups.map((group) => ({
							id: group.id,
							label: group.name,
						}))}
						emptyLabel={t("content.userTable.emptyValue")}
					/>
				),
			},
			{
				id: "access",
				header: t("content.userTable.columns.access"),
				accessorFn: (row) => row.institutions?.length ?? 0,
				enableSorting: true,
				sortingFn: (rowA, rowB) =>
					(rowA.original.institutions?.length ?? 0) -
					(rowB.original.institutions?.length ?? 0),
				cell: ({ row }) => {
					const hasInstitutionReadAll = Boolean(
						row.original.role?.table_permissions?.some(
							(permission) =>
								permission.table === "institution" &&
								permission.action === "read" &&
								(permission.scope ?? "own") === "all",
						),
					);

					return (
						<div className="flex flex-col gap-1">
							<span className="body3">
								{hasInstitutionReadAll
									? t("content.userTable.accessAll", { defaultValue: "Alle" })
									: t("content.userTable.institutionsCount", {
											count: row.original.institutions?.length ?? 0,
										})}
							</span>
						</div>
					);
				},
			},
		],

		data: filteredUsers,
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: t("content.userTable.searchPlaceholder"),
		getSearchableValues: (row) => [
			row.email,
			row.role?.name ?? "",
			row.status,
			...row.groups.map((group) => group.name),
		],

		filterModal: {
			triggerLabel: t("content.userTable.filter.button", {
				defaultValue: "Filter",
			}),
			triggerAriaLabel: t("content.userTable.filter.button", {
				defaultValue: "Filter",
			}),
			title: t("content.userTable.filter.title", {
				defaultValue: "Filter users",
			}),
			description: t("content.userTable.filter.description", {
				defaultValue: "Narrow users by status, role, groups, and compliance.",
			}),
			content: ({ close }) => (
				<UserFilterPanel
					value={draftFilters}
					roleOptions={roleOptions}
					groupOptions={groupOptions}
					getStatusLabel={getStatusLabel}
					onChange={setDraftFilters}
					onApply={() => {
						setFilters(draftFilters);
						close();
					}}
					onReset={() => {
						setDraftFilters(defaultFilters);
						setFilters(defaultFilters);
					}}
					onCancel={close}
				/>
			),
		},
		primaryButton: {
			label: t("content.userTable.actions.add"),
			onClick: () => router.push(toLocalePath("/account/users/new")),
		},
		emptyState: (
			<EmptyActionState
				title={t("content.userTable.empty.title", {
					defaultValue: "Keine Nutzer*innen gefunden.",
				})}
				description={t("content.userTable.empty.description", {
					defaultValue: "Legen Sie eine neue Nutzer*in an, um zu starten.",
				})}
				actions={[
					{
						icon: <Plus className="size-5" />,
						label: t("content.userTable.actions.add"),
						href: toLocalePath("/account/users/new"),
					},
				]}
			/>
		),

		onReview: (row) =>
			router.push(toLocalePath(`/account/users/${row.id}/review`)),
		onReviewPrefetch: (row) => {
			void router.prefetch(toLocalePath(`/account/users/${row.id}/review`));
		},
		getCanReview: (row) => (row.submissions?.length ?? 0) > 0,
		reviewAriaLabel: t("content.userTable.actions.reviewClaims", {
			defaultValue: "Claims prüfen",
		}),
		onEdit: (row) => router.push(toLocalePath(`/account/users/${row.id}/edit`)),
		onEditPrefetch: (row) => {
			void router.prefetch(toLocalePath(`/account/users/${row.id}/edit`));
		},
		emptyMessage: t("content.userTable.emptyMessage"),
	};

	return (
		<>
			<DataTable config={tableConfig} />
		</>
	);
}
