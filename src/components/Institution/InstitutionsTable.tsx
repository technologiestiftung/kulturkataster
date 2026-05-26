"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import type { Institution, InstitutionTableRow } from "@/types/institution";
import type { Category, FilterState } from "@/types";
import { useAccountStore } from "@/lib/store/accountStore";
import { StatusDot } from "../ui/status-dot";
import { InstitutionStatus } from "@/generated/prisma";
import type { SubmissionType } from "@/generated/prisma";
import { useTranslation } from "react-i18next";
import { getFieldLabel, getFieldOptionLabel } from "@/lib/i18n/fieldLabels";
import {
	formatInstitutionBoolean,
	formatInstitutionDate,
	getParentCategories,
	getSubcategories,
} from "@/lib/utils/institutionUtils";
import { buildStreetLine } from "@/lib/utils/formUtils";
import { Badge } from "../ui/badge";
import Link from "next/link";
import {
	buildSubmissionRow,
	formatFundingSources,
	isSubmissionRow,
} from "@/lib/utils/institutionTableUtils";
import { institutionSubmissionToDraft } from "@/lib/utils/institutionSubmissionUtils";
import Send from "@/icons/send.svg";
import { FilterPanel } from "@/components/Filter/FilterPanel";
import { useInstitutionFilterCategories } from "@/lib/hooks/useInstitutionFilterCategories";
import { useInstitutionTableFilters } from "@/lib/hooks/useInstitutionTableFilters";
import { useInstitutionDraftStore } from "@/lib/store/institutionDraftStore";
import { canReviewInstitutionSubmissionType } from "@/lib/utils/submissionReviewPermissions";
import { EmptyActionState } from "@/components/EmptyActionState";
import Edit from "@/icons/edit.svg";
import { useInstitutionPrivateFieldResolver } from "@/lib/hooks/useInstitutionPrivateFieldResolver";
import { DownloadModal } from "@/components/Modals/Pages/DownloadModal";
import { notifyInstitutionDownload } from "@/server/actions/downloads";
import type { ExportFormat } from "@/lib/utils/downloadUtils";

type InstitutionsFilterPanelProps = {
	filters: FilterState;
	categoryGroups: Category[];
	districts: string[];
	filteredCount: number;
	categoryCounts: Record<string, number>;
	subcategoryCounts: Record<string, number>;
	loading: boolean;
	onRetry: () => void;
	onFiltersChange: (nextFilters: FilterState) => void;
};

function InstitutionsFilterPanel({
	filters,
	categoryGroups,
	districts,
	filteredCount,
	categoryCounts,
	subcategoryCounts,
	loading,
	onRetry,
	onFiltersChange,
}: InstitutionsFilterPanelProps) {
	useEffect(() => {
		if (categoryGroups.length === 0) {
			onRetry();
		}
	}, [categoryGroups.length, onRetry]);

	return (
		<FilterPanel
			filters={filters}
			categoryGroups={categoryGroups}
			districts={districts}
			filteredCount={filteredCount}
			categoryCounts={categoryCounts}
			subcategoryCounts={subcategoryCounts}
			loading={loading}
			error={null}
			onRetry={onRetry}
			onFiltersChange={onFiltersChange}
			parentCategorySelectionBehavior="last-child-only"
		/>
	);
}

export function InstitutionsTable() {
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const institutions = useAccountStore((state) => state.institutions);
	const allSubmissions = useAccountStore((state) => state.submissions);
	const institutionPermissions = useAccountStore(
		(state) => state.institutionPermissions,
	);
	const setActiveInstitutionEdit = useAccountStore(
		(state) => state.setActiveInstitutionEdit,
	);
	const setDraft = useInstitutionDraftStore((state) => state.setDraft);
	const setDraftMode = useInstitutionDraftStore((state) => state.setMode);
	const setDraftStepId = useInstitutionDraftStore((state) => state.setStepId);
	const resetDraft = useInstitutionDraftStore((state) => state.resetDraft);
	const canCreateInstitutionDirect = institutionPermissions.create;
	const canCreateInstitutionViaSubmission =
		!canCreateInstitutionDirect && institutionPermissions.createSubmission;
	const canClaimInstitution = institutionPermissions.createSubmission;
	const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
	const canReviewSubmissionType = (type: SubmissionType) => {
		return canReviewInstitutionSubmissionType(institutionPermissions, type);
	};
	const submissions = useMemo(
		() =>
			allSubmissions.filter(
				(s) =>
					s.entity_type === "institution" &&
					(s.type === "create" ||
						s.type === "update" ||
						s.type === "claim" ||
						s.type === "delete"),
			),
		[allSubmissions],
	);
	const { t } = useTranslation("content");
	const { t: tCommon } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");
	const { isPrivateField } = useInstitutionPrivateFieldResolver();
	const {
		filterCategoryGroups,
		flattenedCategories,
		isFilterCategoriesLoading,
		retryInitializeFilterCategories,
	} = useInstitutionFilterCategories();
	const translateEnum = (prefix: string, value?: string | null) => {
		if (!value) return "—";
		return getFieldOptionLabel(tEnum, prefix, value);
	};
	const translateFundingSource = (value: string) =>
		getFieldOptionLabel(tEnum, "funding_source", value);
	const headerLabel = (key: string, _fallback?: string) =>
		getFieldLabel(tEnum, key);
	const renderEmptyValue = () => <span className="text-foreground">—</span>;
	const renderTextValue = (value?: string | null) => {
		if (typeof value !== "string" || value.trim().length === 0) {
			return renderEmptyValue();
		}
		return value;
	};
	const renderNumericValue = (value?: number | null) => {
		if (typeof value !== "number") return renderEmptyValue();
		if (value === 0) return renderEmptyValue();
		return value.toString();
	};
	const getStatusLabel = (status: InstitutionStatus | string) => {
		const institutionStatus = tEnum(`institution_status.${status}`);
		if (institutionStatus !== `institution_status.${status}`) {
			return institutionStatus;
		}
		const submissionStatus = tEnum(`submission_status.${status}`);
		if (submissionStatus !== `submission_status.${status}`) {
			return submissionStatus;
		}
		return status;
	};
	const getSubmissionTypeLabel = (
		type: SubmissionType,
		status?: string | null,
	) => {
		const baseTypeLabel = t(`institutionsTable.type.submissionBase.${type}`, {
			defaultValue: type,
		});
		if (
			status === "approved" ||
			status === "rejected" ||
			status === "needs_changes"
		) {
			return t(`institutionsTable.type.submissionStatus.${status}`, {
				type: baseTypeLabel,
				defaultValue: baseTypeLabel,
			});
		}
		return t(`institutionsTable.type.submission.${type}`, {
			defaultValue: type,
		});
	};
	const isPrivateColumn = useCallback(
		(columnId: string) => {
			const fieldName = columnId === "owner" ? "owner_name" : columnId;
			return isPrivateField({ value: fieldName });
		},
		[isPrivateField],
	);

	const tableRows = useMemo<InstitutionTableRow[]>(() => {
		const submissionRows = submissions.map((submission) =>
			buildSubmissionRow(submission, flattenedCategories),
		);
		const institutionRows = institutions.map((institution) => ({
			...institution,
			rowKind: "institution" as const,
			rowKey: `institution-${institution.id}`,
		}));
		return [...submissionRows, ...institutionRows];
	}, [flattenedCategories, institutions, submissions]);

	const canEditInstitutionRow = (row: InstitutionTableRow) =>
		!isSubmissionRow(row) && institutionPermissions.update;
	const getInstitutionForEdit = (row: InstitutionTableRow) => {
		if (isSubmissionRow(row)) return null;
		return institutions.find((item) => item.id === row.id) ?? null;
	};

	const {
		filters,
		setFilters,
		districts,
		filteredTableRows,
		categoryCounts,
		subcategoryCounts,
		downloadableInstitutions,
	} = useInstitutionTableFilters(tableRows, filterCategoryGroups);
	const handleDownloadNotification = useCallback(async (args: {
		data: Institution[];
		filename: string;
		format: ExportFormat;
	}) => {
		await notifyInstitutionDownload({
			filename: args.filename,
			format: args.format,
			institutionCount: args.data.length,
			institutionIds: args.data.map((institution) => institution.id),
		});
	}, []);
	const closeDownloadDialog = useCallback((open: boolean) => {
		setIsDownloadDialogOpen(open);
	}, []);

	const tableConfig: DataTableConfig<InstitutionTableRow> = {
		isPrivateColumn,
		privateColumnAriaLabel: tCommon("sensitiveInformation", {
			defaultValue: "Sensitive information",
		}),
		columns: [
			{
				accessorKey: "status",
				header: "",
				enableSorting: true,
				meta: { pin: "left", exportKey: "status" },
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
					if (institution.rowKind === "submission") {
						if (institution.status === "approved") variant = "success";
						else if (institution.status === "approval_pending")
							variant = "info";
						else if (institution.status === "rejected") variant = "error";
						else if (institution.status === "needs_changes")
							variant = "warning";
					}
					return (
						<StatusDot
							tone={variant}
							label={getStatusLabel(institution?.status || "draft")}
							showLabel="hover"
						/>
					);
				},
			},
			{
				accessorKey: "type",
				header: headerLabel("type", "Type"),
				enableSorting: true,
				meta: { pin: "left", exportKey: "type" },
				size: 110,
				cell: ({ row }) => {
					if (row.original.rowKind === "submission") {
						return (
							<p className="capitalize text-wrap self-center text-center  flex-wrap ">
								{getSubmissionTypeLabel(
									row.original.submissionType,
									row.original.status,
								)}
							</p>
						);
					}
					return (
						<p className="capitalize text-wrap self-center text-center flex-wrap ">
							{t("institutionsTable.type.manage")}
						</p>
					);
				},
			},
			{
				accessorKey: "id",
				header: headerLabel("id", "Id"),
				enableSorting: true,
				meta: { pin: "left", exportKey: "id" },
				size: 65,
				cell: ({ row }) => {
					const id = String(row.original.id);
					if (row.original.rowKind !== "institution") {
						return id;
					}
					return (
						<Link
							href={toLocalePath(`/map/institution/${id}`)}
							target="_blank"
							rel="noreferrer"
							className="text-primary-dark underline"
						>
							{id}
						</Link>
					);
				},
			},
			{
				accessorKey: "name",
				header: headerLabel("name", "Name"),
				enableSorting: true,
				size: 250,
				meta: { pin: "left", truncate: true, exportKey: "name" },
				cell: ({ row }) => {
					const name = row.original.name || "—";
					// if (isSubmissionRow(row.original)) {
					// 	return (
					// 		<div className="flex items-center gap-2">
					// 			<span>{name}</span>
					// 			<Badge variant="default">In Prüfung</Badge>
					// 		</div>
					// 	);
					// }
					return name;
				},
			},
			{
				accessorKey: "parent_organization",
				header: headerLabel("parent_organization", "Parent Organization"),
				enableSorting: true,
				size: 250,
				meta: { truncate: true, exportKey: "parent_organization" },
				cell: ({ row }) => renderTextValue(row.original.parent_organization),
			},
			{
				accessorKey: "email",
				header: headerLabel("email", "Email"),
				enableSorting: true,
				size: 250,
				meta: { truncate: true, exportKey: "email" },
				cell: ({ row }) => {
					const email = row.original.email;
					if (!email) return "—";
					return (
						<Link
							className="text-primary-dark underline"
							href={`mailto:${email}`}
						>
							{email}
						</Link>
					);
				},
			},
			{
				accessorKey: "phone",
				header: headerLabel("phone", "Phone"),
				enableSorting: true,
				size: 150,
				meta: { truncate: true, exportKey: "phone" },
				cell: ({ row }) => {
					const phone = row.original.phone;
					if (!phone) return "—";
					return (
						<Link className="text-primary-dark underline" href={`tel:${phone}`}>
							{phone}
						</Link>
					);
				},
			},
			{
				accessorKey: "website",
				header: headerLabel("website", "Website"),
				enableSorting: true,
				size: 350,
				meta: { truncate: true, exportKey: "website" },
				cell: ({ row }) => {
					const url = row.original.website;
					if (!url) return "—";
					return (
						<Link
							href={url}
							target="_blank"
							rel="noreferrer"
							className="underline text-primary-dark hover:text-primary/80"
						>
							{url}
						</Link>
					);
				},
			},
			{
				accessorKey: "address.cultural_area",
				header: headerLabel("cultural_area", "Cultural Area"),
				enableSorting: true,
				size: 150,
				meta: { truncate: true, exportKey: "cultural_area" },
				cell: ({ row }) => {
					const culturalArea = row.original.address?.cultural_area;

					return renderTextValue(culturalArea);
				},
			},
			{
				accessorKey: "address.street",
				header: `${headerLabel("street", "Street")} & ${headerLabel("street_number", "Number")}`,
				enableSorting: true,
				size: 200,
				meta: { truncate: true, exportKey: "street" },
				cell: ({ row }) => {
					const address = row.original.address;
					if (!address || !address.street || !address.street_number)
						return <span className="text-foreground">—</span>;
					return `${address.street} ${address.street_number}`;
				},
			},
			{
				accessorKey: "address.address_suffix",
				header: headerLabel("address_suffix", "Address Suffix"),
				enableSorting: true,
				size: 150,
				meta: { truncate: true, exportKey: "address_suffix" },
				cell: ({ row }) => {
					const addressSuffix = row.original.address?.address_suffix;
					return renderTextValue(addressSuffix);
				},
			},
			{
				accessorKey: "address.zipcode",
				header: headerLabel("zipcode", "Postal Code"),
				enableSorting: true,
				size: 100,
				meta: { truncate: true, exportKey: "zipcode" },
				cell: ({ row }) => {
					const zipcode = row.original.address?.zipcode;
					return renderTextValue(zipcode);
				},
			},
			{
				accessorKey: "address.city",
				header: headerLabel("city", "City"),
				enableSorting: true,
				size: 100,
				meta: { truncate: true, exportKey: "city" },
				cell: ({ row }) => {
					const city = row.original.address?.city;
					return renderTextValue(city);
				},
			},
			{
				accessorKey: "address.district",
				header: headerLabel("district", "District"),
				enableSorting: true,
				size: 150,
				meta: { truncate: true, exportKey: "district" },
				cell: ({ row }) => {
					const districtValue = row.original.address?.district;
					const district =
						typeof districtValue === "string" && districtValue.trim().length > 0
							? districtValue
							: null;
					return renderTextValue(district);
				},
			},
			{
				accessorKey: "address.neighbourhood",
				header: headerLabel("neighbourhood", "Neighbourhood"),
				enableSorting: true,
				size: 150,
				meta: { truncate: true, exportKey: "neighbourhood" },
				cell: ({ row }) => {
					const neighbourhood = row.original.address?.neighbourhood;
					return renderTextValue(neighbourhood);
				},
			},
			{
				id: "category",
				header: headerLabel("category", "Category"),
				accessorFn: (row) => getParentCategories(row as Partial<Institution>),
				enableSorting: true,
				size: 333,
				meta: { exportKey: ["categories", "subcategories"] },
				cell: ({ row }) => {
					const categories = getParentCategories(
						row.original as Partial<Institution>,
					);
					return (
						<div className="gap-1 flex-wrap flex">
							{categories.length > 0 ? (
								categories.map((cat) => (
									<Badge
										variant="outline"
										key={cat.id}
										className="capitalize truncate"
									>
										{`${tEnum("category." + cat.key)}`}
									</Badge>
								))
							) : (
								<span className="text-foreground">—</span>
							)}
						</div>
					);
				},
			},
			{
				id: "subcategory",
				header: headerLabel("subcategory", "Subcategory"),
				accessorFn: (row) => getSubcategories(row as Partial<Institution>),
				enableSorting: true,
				size: 333,
				cell: ({ row }) => {
					const subcategories = getSubcategories(
						row.original as Partial<Institution>,
					);
					return (
						<div className="gap-1 flex-wrap flex">
							{subcategories.length > 0 ? (
								subcategories.map((cat) => (
									<Badge
										variant="outline"
										key={cat.id}
										className="capitalize truncate"
									>
										{`${tEnum("category." + cat.key)}`}
									</Badge>
								))
							) : (
								<span className="text-foreground">—</span>
							)}
						</div>
					);
				},
			},
			{
				accessorKey: "utilization_status",
				header: headerLabel("utilization_status", "Utilization Status"),
				enableSorting: true,
				size: 160,
				meta: { truncate: true, exportKey: "utilization_status" },
				cell: ({ row }) =>
					translateEnum("utilization_status", row.original.utilization_status),
			},
			{
				accessorKey: "protection_status",
				header: headerLabel("protection_status", "Protection Status"),
				enableSorting: true,
				size: 160,
				meta: { truncate: true, exportKey: "protection_status" },
				cell: ({ row }) =>
					translateEnum("protection_status", row.original.protection_status),
			},
			{
				accessorKey: "protection_status_info",
				header: headerLabel("protection_status_info", "Protection Status Info"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true, exportKey: "protection_status_info" },
				cell: ({ row }) => renderTextValue(row.original.protection_status_info),
			},
			{
				accessorKey: "protection_status_internal_notes",
				header: headerLabel(
					"protection_status_internal_notes",
					"Protection Status Internal Notes",
				),
				enableSorting: true,
				size: 220,
				meta: { truncate: true, exportKey: "protection_status_internal_notes" },
				cell: ({ row }) =>
					renderTextValue(row.original.protection_status_internal_notes),
			},
			{
				accessorKey: "legal_form",
				header: headerLabel("legal_form", "Legal Form"),
				enableSorting: true,
				size: 150,
				meta: { truncate: true, exportKey: "legal_form" },
				cell: ({ row }) => renderTextValue(row.original.legal_form),
			},
			{
				id: "funding_sources",
				accessorFn: (row) =>
					formatFundingSources(row, { translateFundingSource }),
				header: headerLabel("funding_sources", "Funding Sources"),
				enableSorting: true,
				size: 180,
				meta: { truncate: true, exportKey: "funding_sources" },
				cell: ({ row }) =>
					formatFundingSources(row.original, { translateFundingSource }),
			},
			{
				accessorKey: "funding_type",
				header: headerLabel("funding_type", "Funding Type"),
				enableSorting: true,
				size: 180,
				meta: { truncate: true, exportKey: "funding_type" },
				cell: ({ row }) =>
					translateEnum("funding_type", row.original.funding_type),
			},
			{
				id: "owner",
				header: headerLabel("owner_name", "Owner"),
				accessorFn: (row) => row.owner_name || "",
				enableSorting: true,
				size: 150,
				meta: { truncate: true, exportKey: "owner_name" },
				cell: ({ row }) => renderTextValue(row.original.owner_name),
			},
			{
				accessorKey: "owner_type",
				header: headerLabel("owner_type", "Owner Type"),
				enableSorting: true,
				size: 180,
				meta: { truncate: true, exportKey: "owner_type" },
				cell: ({ row }) => translateEnum("owner_type", row.original.owner_type),
			},
			{
				accessorKey: "rental_contract_type",
				header: headerLabel("rental_contract_type", "Rental Contract Type"),
				enableSorting: true,
				size: 170,
				meta: { truncate: true, exportKey: "rental_contract_type" },
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
				meta: { exportKey: "rental_contract_end" },
				cell: ({ row }) =>
					formatInstitutionDate(row.original.rental_contract_end),
			},
			{
				accessorKey: "established_since",
				header: headerLabel("established_since", "Established Since"),
				enableSorting: true,
				meta: { exportKey: "established_since" },
				cell: ({ row }) =>
					formatInstitutionDate(row.original.established_since),
			},
			{
				accessorKey: "established_until",
				header: headerLabel("established_until", "Established Until"),
				enableSorting: true,
				meta: { exportKey: "established_until" },
				cell: ({ row }) =>
					formatInstitutionDate(row.original.established_until),
			},
			{
				accessorKey: "closing_reason",
				header: headerLabel("closing_reason", "Closing Reason"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true, exportKey: "closing_reason" },
				cell: ({ row }) =>
					translateEnum("closing_reason", row.original.closing_reason),
			},
			{
				accessorKey: "area",
				header: headerLabel("area", "Area (m2)"),
				enableSorting: true,
				size: 90,
				meta: { truncate: true, exportKey: "area" },
				cell: ({ row }) => renderNumericValue(row.original.area),
			},
			{
				accessorKey: "number_of_rooms",
				header: headerLabel("number_of_rooms", "Rooms"),
				enableSorting: true,
				size: 150,
				meta: { exportKey: "number_of_rooms" },
				cell: ({ row }) => renderNumericValue(row.original.number_of_rooms),
			},
			{
				accessorKey: "capacity",
				header: headerLabel("capacity", "Capacity"),
				enableSorting: true,
				size: 90,
				meta: { exportKey: "capacity" },
				cell: ({ row }) => renderNumericValue(row.original.capacity),
			},
			{
				accessorKey: "shared_use_allowed",
				header: headerLabel("shared_use_allowed", "Shared Use Allowed"),
				enableSorting: true,
				size: 140,
				meta: { exportKey: "shared_use_allowed" },
				cell: ({ row }) =>
					formatInstitutionBoolean(row.original.shared_use_allowed, tEnum),
			},
			{
				accessorKey: "shared_use_info",
				header: headerLabel("shared_use_info", "Shared Use Info"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true, exportKey: "shared_use_info" },
				cell: ({ row }) => renderTextValue(row.original.shared_use_info),
			},
			{
				accessorKey: "shared_use_equipment",
				header: headerLabel("shared_use_equipment", "Shared Use Equipment"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true, exportKey: "shared_use_equipment" },
				cell: ({ row }) => renderTextValue(row.original.shared_use_equipment),
			},
			{
				accessorKey: "shared_use_audience",
				header: headerLabel("shared_use_audience", "Shared Use Audience"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true, exportKey: "shared_use_audience" },
				cell: ({ row }) => renderTextValue(row.original.shared_use_audience),
			},
			{
				accessorKey: "shared_use_availability",
				header: headerLabel(
					"shared_use_availability",
					"Shared Use Availability",
				),
				enableSorting: true,
				size: 200,
				meta: { truncate: true, exportKey: "shared_use_availability" },
				cell: ({ row }) =>
					renderTextValue(row.original.shared_use_availability),
			},
			{
				accessorKey: "accessibility",
				header: headerLabel("accessibility", "Accessibility"),
				enableSorting: true,
				size: 160,
				meta: { truncate: true, exportKey: "accessibility" },
				cell: ({ row }) => renderTextValue(row.original.accessibility),
			},
			{
				accessorKey: "cost",
				header: headerLabel("cost", "Cost"),
				enableSorting: true,
				size: 140,
				meta: { truncate: true, exportKey: "cost" },
				cell: ({ row }) => renderTextValue(row.original.cost),
			},
			{
				accessorKey: "shared_use_contact_person",
				header: headerLabel(
					"shared_use_contact_person",
					"Shared Use Contact Person",
				),
				enableSorting: true,
				size: 220,
				meta: { truncate: true, exportKey: "shared_use_contact_person" },
				cell: ({ row }) =>
					renderTextValue(row.original.shared_use_contact_person),
			},
			{
				accessorKey: "contact_person_name",
				header: headerLabel(
					"contact_person_first_name",
					"Contact Person First Name",
				),
				enableSorting: true,
				size: 150,
				cell: ({ row }) =>
					row.original.contact_person?.first_name || (
						<span className="text-foreground">—</span>
					),
				accessorFn: (row) => row.contact_person?.first_name || "",
				meta: { truncate: true, exportKey: "contact_person_first_name" },
			},
			{
				accessorKey: "contact_person_last_name",
				header: headerLabel(
					"contact_person_last_name",
					"Contact Person Last Name",
				),
				enableSorting: true,
				size: 150,
				cell: ({ row }) =>
					row.original.contact_person?.last_name || (
						<span className="text-foreground">—</span>
					),
				accessorFn: (row) => row.contact_person?.last_name || "",
				meta: { truncate: true, exportKey: "contact_person_last_name" },
			},
			{
				accessorKey: "contact_person_email",
				header: headerLabel("contact_person_email", "Contact Person Email"),
				enableSorting: true,
				size: 130,
				cell: ({ row }) => renderTextValue(row.original.contact_person?.email),
			},

			{
				accessorKey: "contact_person_phone",
				header: headerLabel("contact_person_phone", "Contact Person Phone"),
				enableSorting: true,
				size: 130,
				cell: ({ row }) => renderTextValue(row.original.contact_person?.phone),
			},
			{
				accessorKey: "notes",
				header: headerLabel("notes", "Notes"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true, exportKey: "notes" },
				cell: ({ row }) => renderTextValue(row.original.notes),
			},
			{
				accessorKey: "internal_notes",
				header: headerLabel("internal_notes", "Internal Notes"),
				enableSorting: true,
				size: 200,
				meta: { truncate: true, exportKey: "internal_notes" },
				cell: ({ row }) => renderTextValue(row.original.internal_notes),
			},
			{
				accessorKey: "source",
				header: headerLabel("source", "Source"),
				enableSorting: true,
				size: 160,
				meta: { truncate: true, exportKey: "source" },
				cell: ({ row }) => renderTextValue(row.original.source),
			},
			{
				id: "tags",
				header: headerLabel("tags", "Tags"),
				accessorFn: (row) =>
					(row.tags ?? [])
						.map((tag) => tag.name)
						.filter((name): name is string => Boolean(name))
						.join(", ") || "—",
				enableSorting: true,
				size: 180,
				meta: { truncate: true },
				cell: ({ row }) =>
					(row.original.tags ?? [])
						.map((tag) => tag.name)
						.filter((name): name is string => Boolean(name))
						.join(", ") || "—",
			},
			{
				accessorKey: "created_at",
				header: headerLabel("created_at", "Created"),
				enableSorting: true,
				size: 100,
				meta: { exportKey: "created_at" },
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
				meta: { exportKey: "updated_at" },
				cell: ({ row }) => {
					const updatedAt = new Date(row.original.updated_at);
					return updatedAt.toLocaleDateString();
				},
				accessorFn: (row) => row.updated_at,
			},
		],
		data: filteredTableRows,
		getRowKey: (row) => row.rowKey ?? row.id,
		searchable: true,
		searchPlaceholder: t("institutionsTable.search.title", {
			defaultValue: "Search institutions...",
		}),
		getSearchableValues: (row) => [
			row.name,
			row.status || "",
			row.address?.city || "",
			typeof row.address?.district === "string" ? row.address.district : "",
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
		filterModal: {
			triggerLabel: t("filter.title"),
			triggerAriaLabel: t("filter.title"),
			title: t("filter.title"),
			content: () => (
				<InstitutionsFilterPanel
					filters={filters}
					categoryGroups={filterCategoryGroups}
					districts={districts}
					filteredCount={filteredTableRows.length}
					categoryCounts={categoryCounts}
					subcategoryCounts={subcategoryCounts}
					loading={isFilterCategoriesLoading}
					onRetry={retryInitializeFilterCategories}
					onFiltersChange={setFilters}
				/>
			),
		},
		primaryButton:
			canCreateInstitutionDirect || canCreateInstitutionViaSubmission
				? {
						label: t("institutionsTable.actions.addInstitution"),
						onClick: () => {
							if (!canCreateInstitutionDirect) {
								resetDraft();
								router.push(toLocalePath("/institution/submission"));
								return;
							}
							router.push(toLocalePath("/account/institutions/new"));
						},
					}
				: undefined,
		secondaryButton: canClaimInstitution
			? {
					label: (
						<span className="inline-flex items-center gap-2">
							<Send className="size-4" />
							<span>{t("institutionsTable.actions.claimInstitution")}</span>
						</span>
					),
					onClick: () =>
						router.push(toLocalePath("/account/submissions/claim")),
				}
			: undefined,
		rightButton: {
			label: t("institutionsTable.actions.downloadList", {
				defaultValue: "Liste herunterladen",
			}),
			onClick: () => setIsDownloadDialogOpen(true),
		},
		onEdit: (row) => {
			if (isSubmissionRow(row)) {
				router.push(
					toLocalePath(`/account/submissions/${row.submissionId}/edit`),
				);
				return;
			}
			if (canEditInstitutionRow(row)) {
				setActiveInstitutionEdit(getInstitutionForEdit(row));
				router.push(toLocalePath(`/account/institutions/${row.id}/edit`));
				return;
			}
			if (institutionPermissions.createSubmission) {
				const institution = row;
				const baseDraft = institutionSubmissionToDraft({
					data: institution as unknown as Record<string, unknown>,
				});
				const address = baseDraft.address ?? institution.address ?? null;
				const contactPerson = institution.contact_person ?? null;
				const categoryIds =
					baseDraft.categoryIds ??
					institution.categories?.map((category) => category.id) ??
					[];

				resetDraft();
				setDraftMode("update");
				setDraftStepId("review");
				setDraft({
					...baseDraft,
					categoryIds,
					entityId: institution.id,
					originalInstitution: institution,
					"address.streetLine": buildStreetLine(
						address?.street,
						address?.street_number,
					),
					"address.city": address?.city ?? "",
					"address.zip": address?.zipcode ?? "",
					"address.district": address?.district ?? "",
					"address.address_suffix": address?.address_suffix ?? "",
					"address.neighbourhood": address?.neighbourhood ?? "",
					"address.cultural_area": address?.cultural_area ?? "",
					"address.lat": address?.lat ?? "",
					"address.lng": address?.lng ?? "",
					contact_person_id:
						baseDraft.contact_person_id ?? contactPerson?.id ?? "",
					contact_person_first_name:
						baseDraft.contact_person_first_name ??
						contactPerson?.first_name ??
						"",
					contact_person_last_name:
						baseDraft.contact_person_last_name ??
						contactPerson?.last_name ??
						"",
					contact_person_email:
						baseDraft.contact_person_email ?? contactPerson?.email ?? "",
					contact_person_phone:
						baseDraft.contact_person_phone ?? contactPerson?.phone ?? "",
				});
				router.push(toLocalePath("/institution/submission"));
			}
		},
		onEditPrefetch: (row) => {
			if (isSubmissionRow(row)) {
				void router.prefetch(
					toLocalePath(`/account/submissions/${row.submissionId}/edit`),
				);
				return;
			}
			if (canEditInstitutionRow(row)) {
				setActiveInstitutionEdit(getInstitutionForEdit(row));
				void router.prefetch(
					toLocalePath(`/account/institutions/${row.id}/edit`),
				);
			}
		},
		getCanEdit: (row) => {
			if (isSubmissionRow(row)) return true;
			return (
				canEditInstitutionRow(row) || institutionPermissions.createSubmission
			);
		},
		onReview: (row) => {
			if (!isSubmissionRow(row)) return;
			if (!canReviewSubmissionType(row.submissionType)) return;
			router.push(toLocalePath(`/account/submissions/${row.submissionId}`));
		},
		onReviewPrefetch: (row) => {
			if (!isSubmissionRow(row)) return;
			if (!canReviewSubmissionType(row.submissionType)) return;
			void router.prefetch(
				toLocalePath(`/account/submissions/${row.submissionId}`),
			);
		},
		getCanReview: (row) =>
			isSubmissionRow(row) && canReviewSubmissionType(row.submissionType),
		reviewAriaLabel: "Review",
		emptyMessage: "No institutions found.",
		emptyState: (
			<EmptyActionState
				title={t("institutionsTable.empty.title", {
					defaultValue: "Keine Kulturorte vorhanden.",
				})}
				description={t("institutionsTable.empty.description", {
					defaultValue: "Sie können direkt neue Einträge starten.",
				})}
				actions={[
					...(canClaimInstitution
						? [
								{
									icon: <Send />,
									label: t("institutionsTable.actions.claimInstitution"),
									href: toLocalePath("/account/submissions/claim"),
								},
							]
						: []),
					...(canCreateInstitutionDirect || canCreateInstitutionViaSubmission
						? [
								{
									icon: <Edit />,
									label: t("institutionsTable.actions.addInstitution"),
									href: toLocalePath(
										canCreateInstitutionDirect
											? "/account/institutions/new"
											: "/institution/submission",
									),
								},
							]
						: []),
				]}
			/>
		),
	};

	const exportColumnOrder = (() => {
		const order = Array.from(
			new Set(
				tableConfig.columns.flatMap((col) => {
					const key = col.meta?.exportKey;
					if (!key) return [] as string[];
					return Array.isArray(key) ? key : [key];
				}),
			),
		);

		const utilizationStatusIndex = order.indexOf("utilization_status");
		if (utilizationStatusIndex !== -1) {
			const utilizationStatusDetails = [
				"utilization_status_info",
				"utilization_status_internal_notes",
			].filter((key) => !order.includes(key));
			order.splice(utilizationStatusIndex + 1, 0, ...utilizationStatusDetails);
		}

		return order;
	})();

	return (
		<>
			<DataTable config={tableConfig} />
			<DownloadModal
				open={isDownloadDialogOpen}
				onCloseRequest={() => closeDownloadDialog(false)}
				data={downloadableInstitutions}
				filename="kulturorte"
				translateFn={tEnum}
				exportColumnOrder={exportColumnOrder}
				confirmLabel={t("institutionsTable.actions.downloadList", {
					defaultValue: "Liste herunterladen",
				})}
				cancelLabel={tCommon("cancel", { defaultValue: "Cancel" })}
				onAfterDownload={handleDownloadNotification}
			/>
		</>
	);
}
