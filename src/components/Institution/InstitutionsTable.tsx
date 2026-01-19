"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { Institution } from "@/types";
import { useAccountStore } from "@/lib/store/accountStore";
import { StatusDot } from "../ui/status-dot";
import { InstitutionStatus } from "@/generated/prisma";
import { useTranslation } from "react-i18next";
import {
	formatInstitutionAddress,
	formatInstitutionBoolean,
	formatInstitutionDate,
	getParentCategories,
	joinInstitutionIds,
} from "@/lib/utils/institutionUtils";
import { Badge } from "../ui/badge";
import { useSearch } from "../../lib/hooks/useSearch";

export function InstitutionsTable() {
	const router = useRouter();
	const institutions = useAccountStore((state) => state.institutions);
	const { t } = useTranslation("content");
	const { t: tEnum } = useTranslation("enumMap");
	const translateEnum = (prefix: string, value?: string | null) => {
		if (!value) return "—";
		const translated = tEnum(`${prefix}.${value}`);
		return translated === `${prefix}.${value}` ? value : translated;
	};
	const headerLabel = (key: string, fallback: string) => {
		const translated = tEnum(`field_names.${key}`);
		return translated === `field_names.${key}` ? fallback : translated;
	};
	const getStatusLabel = (status: InstitutionStatus) => {
		if (status === "approval_pending")
			return t("institutionFormModal.status.approvalPending");
		if (status === "public") return t("institutionFormModal.status.public");
		if (status === "private") return t("institutionFormModal.status.private");
		if (status === "removal_pending")
			return t("institutionFormModal.status.removalPending");
		if (status === "draft") return t("institutionFormModal.status.draft");
		if (status === "archived") return t("institutionFormModal.status.archived");
		return status;
	};

	const tableConfig: DataTableConfig<Institution> = {
		columns: [
			{
				accessorKey: "status",
				header: "",
				enableSorting: true,
				meta: { pin: "left" },
				size: 50,
				cell: ({ row }) => {
					const institution = row.original;
					let variant: "success" | "info" | "warning" | "error" | "neutral" =
						"neutral";

					if (institution.status === "public") variant = "success";
					if (institution.status === "private") variant = "error";
					if (institution.status === "approval_pending") variant = "warning";
					if (institution.status === "removal_pending") variant = "warning";
					if (institution.status === "draft") variant = "neutral";
					if (institution.status === "archived") variant = "error";
					return (
						<StatusDot
							tone={variant}
							label={getStatusLabel(institution.status)}
							showLabel="hover"
						/>
					);
				},
			},
			{
				accessorKey: "id",
				header: headerLabel("id", "Id"),
				enableSorting: true,
				meta: { pin: "left" },
				size: 65,
			},
			{
				accessorKey: "name",
				header: headerLabel("name", "Name"),
				enableSorting: true,
				size: 350,
				enableResizing: false,
				meta: { pin: "left", truncate: true },
			},
			{
				accessorKey: "website",
				header: headerLabel("website", "Website"),
				enableSorting: true,
				size: 350,
				enableResizing: true,
				meta: { truncate: true },
			},
			{
				accessorKey: "phone",
				header: headerLabel("phone", "Phone"),
				enableSorting: true,
				size: 150,
				enableResizing: true,
				meta: { truncate: true },
			},
			{
				accessorKey: "email",
				header: headerLabel("email", "Email"),
				enableSorting: true,
				size: 150,
				enableResizing: true,
				meta: { truncate: true },
			},
			{
				accessorKey: "address.street",
				header: `${headerLabel("street", "Street")} & ${headerLabel("street_number", "Number")}`,
				enableSorting: true,
				size: 150,
				enableResizing: true,
				meta: { truncate: true },
				cell: ({ row }) => {
					const address = row.original.address;
					if (!address) return <span className="text-foreground">—</span>;
					return `${address.street} ${address.street_number}`;
				},
			},
			{
				accessorKey: "address.city",
				header: headerLabel("city", "City"),
				enableSorting: true,
				size: 100,
				enableResizing: true,
				meta: { truncate: true },
			},
			{
				accessorKey: "address.zipcode",
				header: headerLabel("zipcode", "Postal Code"),
				enableSorting: true,
				size: 100,
				enableResizing: true,
				meta: { truncate: true },
			},
			{
				accessorKey: "address.district",
				header: headerLabel("district", "District"),
				enableSorting: true,
				size: 150,
				enableResizing: true,
				meta: { truncate: true },
			},
			{
				id: "address",
				header: headerLabel("address", "Address"),
				accessorFn: (row) => formatInstitutionAddress(row),
				enableSorting: true,
				size: 240,
				meta: { truncate: true },
				cell: ({ row }) => formatInstitutionAddress(row.original),
			},
			{
				accessorKey: "parent_organization",
				header: headerLabel("parent_organization", "Parent Organization"),
				enableSorting: true,
				size: 250,
				enableResizing: true,
				meta: { truncate: true },
			},
			{
				accessorKey: "area",
				header: headerLabel("area", "Area (m2)"),
				enableSorting: true,
				size: 90,
				enableResizing: true,
				meta: { truncate: true },
			},
			{
				accessorKey: "number_of_rooms",
				header: headerLabel("number_of_rooms", "Rooms"),
				enableSorting: true,
				size: 80,
				enableResizing: true,
			},
			{
				accessorKey: "legal_form",
				header: headerLabel("legal_form", "Legal Form"),
				enableSorting: true,
				size: 150,
				enableResizing: true,
				meta: { truncate: true },
			},
			{
				accessorKey: "capacity",
				header: headerLabel("capacity", "Capacity"),
				enableSorting: true,
				size: 90,
				enableResizing: true,
			},
			{
				id: "category",
				header: headerLabel("category", "Category"),
				accessorFn: (row) => row.categories[0]?.key || "",
				enableSorting: true,
				size: 250,
				cell: ({ row }) => {
					return (
						<div className="gap-1 flex-wrap flex">
							{getParentCategories(row.original).map((cat) => (
								<Badge
									variant="outline"
									key={cat.id}
									className="capitalize truncate"
								>
									{`${tEnum("category." + cat.key)}`}
								</Badge>
							))}
						</div>
					);
				},
			},
			{
				id: "owner",
				header: headerLabel("owner_name", "Owner"),
				accessorFn: (row) => row.owner_name || "",
				enableSorting: true,
				size: 150,
				meta: { truncate: true },
				cell: ({ row }) =>
					row.original.owner_name || <span className="text-foreground">—</span>,
			},
			{
				accessorKey: "owner_type",
				header: headerLabel("owner_type", "Owner Type"),
				enableSorting: true,
				size: 140,
				meta: { truncate: true },
				cell: ({ row }) => translateEnum("owner_type", row.original.owner_type),
			},
			{
				accessorKey: "rental_contract_type",
				header: headerLabel("rental_contract_type", "Rental Contract Type"),
				enableSorting: true,
				size: 170,
				meta: { truncate: true },
				cell: ({ row }) =>
					translateEnum(
						"rental_contract_type",
						row.original.rental_contract_type,
					),
			},
			{
				accessorKey: "rental_contract_end",
				header: headerLabel("rental_contract_end", "Rental Contract End"),
				enableSorting: true,
				size: 130,
				cell: ({ row }) =>
					formatInstitutionDate(row.original.rental_contract_end),
			},
			{
				accessorKey: "funding_type",
				header: headerLabel("funding_type", "Funding Type"),
				enableSorting: true,
				size: 140,
				meta: { truncate: true },
				cell: ({ row }) =>
					translateEnum("funding_type", row.original.funding_type),
			},
			{
				accessorKey: "utilization_status",
				header: headerLabel("utilization_status", "Utilization Status"),
				enableSorting: true,
				size: 160,
				meta: { truncate: true },
				cell: ({ row }) =>
					translateEnum("utilization_status", row.original.utilization_status),
			},
			{
				accessorKey: "utilization_status_info",
				header: headerLabel(
					"utilization_status_info",
					"Utilization Status Info",
				),
				enableSorting: true,
				size: 200,
				meta: { truncate: true },
			},
			{
				accessorKey: "protection_status",
				header: headerLabel("protection_status", "Protection Status"),
				enableSorting: true,
				size: 160,
				meta: { truncate: true },
				cell: ({ row }) =>
					translateEnum("protection_status", row.original.protection_status),
			},
			{
				accessorKey: "protection_status_info",
				header: headerLabel("protection_status_info", "Protection Status Info"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true },
			},
			{
				accessorKey: "shared_use_allowed",
				header: headerLabel("shared_use_allowed", "Shared Use Allowed"),
				enableSorting: true,
				size: 140,
				cell: ({ row }) =>
					formatInstitutionBoolean(row.original.shared_use_allowed),
			},
			{
				accessorKey: "shared_use_info",
				header: headerLabel("shared_use_info", "Shared Use Info"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true },
			},
			{
				accessorKey: "shared_use_equipment",
				header: headerLabel("shared_use_equipment", "Shared Use Equipment"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true },
			},
			{
				accessorKey: "shared_use_audience",
				header: headerLabel("shared_use_audience", "Shared Use Audience"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true },
			},
			{
				accessorKey: "shared_use_availability",
				header: headerLabel(
					"shared_use_availability",
					"Shared Use Availability",
				),
				enableSorting: true,
				size: 200,
				meta: { truncate: true },
			},
			{
				accessorKey: "accessibility",
				header: headerLabel("accessibility", "Accessibility"),
				enableSorting: true,
				size: 160,
				meta: { truncate: true },
			},
			{
				accessorKey: "cost",
				header: headerLabel("cost", "Cost"),
				enableSorting: true,
				size: 140,
				meta: { truncate: true },
			},
			{
				accessorKey: "established_since",
				header: headerLabel("established_since", "Established Since"),
				enableSorting: true,
				size: 130,
				cell: ({ row }) =>
					formatInstitutionDate(row.original.established_since),
			},
			{
				accessorKey: "established_until",
				header: headerLabel("established_until", "Established Until"),
				enableSorting: true,
				size: 130,
				cell: ({ row }) =>
					formatInstitutionDate(row.original.established_until),
			},
			{
				accessorKey: "closing_reason",
				header: headerLabel("closing_reason", "Closing Reason"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true },
				cell: ({ row }) =>
					translateEnum("closing_reason", row.original.closing_reason),
			},
			{
				accessorKey: "notes",
				header: headerLabel("notes", "Notes"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true },
			},
			{
				accessorKey: "internal_notes",
				header: headerLabel("internal_notes", "Internal Notes"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true },
			},
			{
				accessorKey: "source",
				header: headerLabel("source", "Source"),
				enableSorting: true,
				size: 160,
				meta: { truncate: true },
			},
			{
				accessorKey: "shared_use_contact_person",
				header: headerLabel(
					"shared_use_contact_person",
					"Shared Use Contact Person",
				),
				enableSorting: true,
				size: 220,
				meta: { truncate: true },
			},
			{
				accessorKey: "contact_person_id",
				header: headerLabel("contact_person_id", "Contact Person Id"),
				enableSorting: true,
				size: 130,
			},
			{
				id: "categoryIds",
				header: `${headerLabel("categories", "Categories")} Ids`,
				accessorFn: (row) =>
					joinInstitutionIds((row.categories ?? []).map((cat) => cat.id)),
				enableSorting: true,
				size: 180,
				meta: { truncate: true },
				cell: ({ row }) =>
					joinInstitutionIds(
						(row.original.categories ?? []).map((cat) => cat.id),
					),
			},
			{
				id: "tagIds",
				header: `${headerLabel("tags", "Tags")} Ids`,
				accessorFn: (row) =>
					joinInstitutionIds((row.tags ?? []).map((tag) => tag.id)),
				enableSorting: true,
				size: 180,
				meta: { truncate: true },
				cell: ({ row }) =>
					joinInstitutionIds((row.original.tags ?? []).map((tag) => tag.id)),
			},
			{
				id: "userIds",
				header: "User Ids",
				accessorFn: (row) =>
					joinInstitutionIds((row.users ?? []).map((user) => user.id)),
				enableSorting: true,
				size: 220,
				meta: { truncate: true },
				cell: ({ row }) =>
					joinInstitutionIds((row.original.users ?? []).map((user) => user.id)),
			},
			{
				id: "groupIds",
				header: "Group Ids",
				accessorFn: (row) =>
					joinInstitutionIds((row.groups ?? []).map((group) => group.id)),
				enableSorting: true,
				size: 180,
				meta: { truncate: true },
				cell: ({ row }) =>
					joinInstitutionIds(
						(row.original.groups ?? []).map((group) => group.id),
					),
			},
			{
				accessorKey: "created_at",
				header: headerLabel("created_at", "Created"),
				enableSorting: true,
				size: 100,
				cell: ({ row }) => {
					const createdAt = new Date(row.original.created_at);
					return createdAt.toLocaleDateString();
				},
				accessorFn: (row) => row.created_at,
			},
			{
				accessorKey: "updated_by",
				header: headerLabel("updated_at", "Updated"),
				enableSorting: true,
				size: 100,
				cell: ({ row }) => {
					const updatedAt = new Date(row.original.updated_at);
					return updatedAt.toLocaleDateString();
				},
				accessorFn: (row) => row.updated_at,
			},
		],
		data: institutions || [],
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: "Search institutions...",
		getSearchableValues: (row) => [
			row.name,
			row.status,
			row.address?.city || "",
			row.address?.district || "",
			row.address?.street || "",
			row.address?.zipcode || "",
			row.address?.neighbourhood || "",
			row.contact_person?.last_name || "",
			row.contact_person?.phone || "",
			row.website || "",
			row.email || "",
			row.contact_person?.first_name || "",
			row.parent_organization || "",
			row.contact_person?.first_name || "",
			row.contact_person?.email || "",
			row.owner_name || "",
		],
		virtualization: {
			enabled: true,
			rowHeight: 65,
			overscan: 8,
		},
		primaryButton: {
			label: "Add Institution",
			onClick: () => router.push("/account/institutions/new"),
		},
		onEdit: (row) => router.push(`/account/institutions/${row.id}/edit`),
		emptyMessage: "No institutions found.",
	};

	return (
		<>
			<DataTable config={tableConfig} />
		</>
	);
}
