"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import type { DataTableConfig } from "@/components/DataTable";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import type { Institution, InstitutionTableRow } from "@/types/institution";
import { useAccountStore } from "@/lib/store/accountStore";
import { StatusDot } from "../ui/status-dot";
import { InstitutionStatus } from "@/generated/prisma";
import type { SubmissionType } from "@/generated/prisma";
import { useTranslation } from "react-i18next";
import { getFieldLabel } from "@/lib/i18n/fieldLabels";
import {
	formatInstitutionBoolean,
	formatInstitutionDate,
	getParentCategories,
	getSubcategories,
	joinInstitutionIds,
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

export function InstitutionsTable() {
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const institutions = useAccountStore((state) => state.institutions);
	const allSubmissions = useAccountStore((state) => state.submissions);
	const institutionPermissions = useAccountStore(
		(state) => state.institutionPermissions,
	);
	const setDraft = useInstitutionDraftStore((state) => state.setDraft);
	const setDraftMode = useInstitutionDraftStore((state) => state.setMode);
	const setDraftStepId = useInstitutionDraftStore((state) => state.setStepId);
	const resetDraft = useInstitutionDraftStore((state) => state.resetDraft);
	const canCreateInstitutionDirect = institutionPermissions.create;
	const canCreateInstitutionViaSubmission =
		!canCreateInstitutionDirect && institutionPermissions.createSubmission;
	const canClaimInstitution = institutionPermissions.createSubmission;
	const canReviewSubmissionType = (type: SubmissionType) => {
		if (!institutionPermissions.reviewSubmission) return false;
		if (type === "create") return institutionPermissions.create;
		if (type === "update" || type === "claim")
			return institutionPermissions.update;
		if (type === "delete") return institutionPermissions.delete;
		return false;
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
	const { t: tEnum } = useTranslation("enumMap");
	const {
		filterCategoryGroups,
		flattenedCategories,
		isFilterCategoriesLoading,
		retryInitializeFilterCategories,
	} = useInstitutionFilterCategories();
	const translateEnum = (prefix: string, value?: string | null) => {
		if (!value) return "—";
		const translated = tEnum(`${prefix}.${value}`);
		return translated === `${prefix}.${value}` ? value : translated;
	};
	const headerLabel = (key: string, fallback: string) =>
		getFieldLabel(tEnum, key, fallback);
	const translateFundingSource = (value: string) => {
		const translated = tEnum(`funding_source.${value}`);
		return translated === `funding_source.${value}` ? value : translated;
	};
	const getStatusLabel = (status: InstitutionStatus | string) => {
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

	const {
		filters,
		setFilters,
		districts,
		filteredTableRows,
		categoryCounts,
		subcategoryCounts,
	} = useInstitutionTableFilters(tableRows, filterCategoryGroups);

	const tableConfig: DataTableConfig<InstitutionTableRow> = {
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
				meta: { pin: "left" },
				size: 110,
				cell: ({ row }) => {
					if (row.original.rowKind === "submission") {
						return (
							<Badge variant="outline" className="capitalize">
								{t(
									`institutionsTable.type.submission.${row.original.submissionType}`,
									{ defaultValue: row.original.submissionType },
								)}
							</Badge>
						);
					}
					return (
						<Badge variant="default" className="capitalize">
							{t("institutionsTable.type.manage")}
						</Badge>
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
				meta: { pin: "left", truncate: true },
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
				accessorKey: "email",
				header: headerLabel("email", "Email"),
				enableSorting: true,
				size: 150,
				meta: { truncate: true },
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
				meta: { truncate: true },
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
				meta: { truncate: true },
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
				accessorKey: "address.street",
				header: `${headerLabel("street", "Street")} & ${headerLabel("street_number", "Number")}`,
				enableSorting: true,
				size: 150,
				meta: { truncate: true },
				cell: ({ row }) => {
					const address = row.original.address;
					if (!address || !address.street || !address.street_number)
						return <span className="text-foreground">—</span>;
					return `${address.street} ${address.street_number}`;
				},
			},
			{
				accessorKey: "address.city",
				header: headerLabel("city", "City"),
				enableSorting: true,
				size: 100,
				meta: { truncate: true },
				cell: ({ row }) => {
					const city = row.original.address?.city;
					if (!city) return <span className="text-foreground">—</span>;
					return city;
				},
			},
			{
				accessorKey: "address.zipcode",
				header: headerLabel("zipcode", "Postal Code"),
				enableSorting: true,
				size: 100,
				meta: { truncate: true },
				cell: ({ row }) => {
					const zipcode = row.original.address?.zipcode;
					if (!zipcode) return <span className="text-foreground">—</span>;
					return zipcode;
				},
			},
			{
				accessorKey: "address.neighbourhood",
				header: headerLabel("neighbourhood", "Neighbourhood"),
				enableSorting: true,
				size: 150,
				meta: { truncate: true },
				cell: ({ row }) => {
					const neighbourhood = row.original.address?.neighbourhood;
					if (!neighbourhood) return <span className="text-foreground">—</span>;
					return neighbourhood;
				},
			},
			{
				accessorKey: "address.district",
				header: headerLabel("district", "District"),
				enableSorting: true,
				size: 150,
				meta: { truncate: true },
				cell: ({ row }) => {
					const district = row.original.address?.district;
					if (!district) return <span className="text-foreground">—</span>;
					return district;
				},
			},
			{
				accessorKey: "address.cultural_area",
				header: headerLabel("cultural_area", "Cultural Area"),
				enableSorting: true,
				size: 150,
				meta: { truncate: true },
				cell: ({ row }) => {
					const culturalArea = row.original.address?.cultural_area;

					if (!culturalArea) return <span className="text-foreground">—</span>;
					return culturalArea;
				},
			},
			{
				accessorKey: "parent_organization",
				header: headerLabel("parent_organization", "Parent Organization"),
				enableSorting: true,
				size: 250,
				meta: { truncate: true },
				cell: ({ row }) =>
					row.original.parent_organization || (
						<span className="text-foreground">—</span>
					),
			},
			{
				accessorKey: "area",
				header: headerLabel("area", "Area (m2)"),
				enableSorting: true,
				size: 90,
				meta: { truncate: true },
				cell: ({ row }) =>
					row.original.area ? (
						row.original.area.toString()
					) : (
						<span className="text-foreground">—</span>
					),
			},
			{
				accessorKey: "number_of_rooms",
				header: headerLabel("number_of_rooms", "Rooms"),
				enableSorting: true,
				size: 80,
				cell: ({ row }) =>
					row.original.number_of_rooms ? (
						row.original.number_of_rooms.toString()
					) : (
						<span className="text-foreground">—</span>
					),
			},
			{
				accessorKey: "legal_form",
				header: headerLabel("legal_form", "Legal Form"),
				enableSorting: true,
				size: 150,
				meta: { truncate: true },
				cell: ({ row }) =>
					row.original.legal_form || <span className="text-foreground">—</span>,
			},
			{
				accessorKey: "capacity",
				header: headerLabel("capacity", "Capacity"),
				enableSorting: true,
				size: 90,
				cell: ({ row }) =>
					row.original.capacity ? (
						row.original.capacity.toString()
					) : (
						<span className="text-foreground">—</span>
					),
			},
			{
				id: "category",
				header: headerLabel("category", "Category"),
				accessorFn: (row) => getParentCategories(row as Partial<Institution>),
				enableSorting: true,
				size: 333,
				cell: ({ row }) => {
					return (
						<div className="gap-1 flex-wrap flex">
							{getParentCategories(row.original as Partial<Institution>).map(
								(cat) => (
									<Badge
										variant="outline"
										key={cat.id}
										className="capitalize truncate"
									>
										{`${tEnum("category." + cat.key)}`}
									</Badge>
								),
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
					return (
						<div className="gap-1 flex-wrap flex">
							{getSubcategories(row.original as Partial<Institution>).map(
								(cat) => (
									<Badge
										variant="outline"
										key={cat.id}
										className="capitalize truncate"
									>
										{`${tEnum("subcategory." + cat.key)}`}
									</Badge>
								),
							)}
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
				id: "funding_sources",
				accessorFn: (row) =>
					formatFundingSources(row, { translateFundingSource }),
				header: headerLabel("funding_sources", "Funding Sources"),
				enableSorting: true,
				size: 140,
				meta: { truncate: true },
				cell: ({ row }) =>
					formatFundingSources(row.original, { translateFundingSource }),
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
		data: filteredTableRows,
		getRowKey: (row) => row.rowKey ?? row.id,
		searchable: true,
		searchPlaceholder: "Search institutions...",
		getSearchableValues: (row) => [
			row.name,
			row.status || "",
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
		filterModal: {
			triggerLabel: t("filter.title"),
			triggerAriaLabel: t("filter.title"),
			title: t("filter.title"),
			content: () => (
				<FilterPanel
					filters={filters}
					categoryGroups={filterCategoryGroups}
					districts={districts}
					filteredCount={filteredTableRows.length}
					categoryCounts={categoryCounts}
					subcategoryCounts={subcategoryCounts}
					loading={isFilterCategoriesLoading}
					error={null}
					onRetry={retryInitializeFilterCategories}
					onFiltersChange={setFilters}
				/>
			),
		},
		primaryButton:
			canCreateInstitutionDirect || canCreateInstitutionViaSubmission
				? {
						label: t("institutionsTable.actions.addInstitution"),
						onClick: () =>
							router.push(
								toLocalePath(
									canCreateInstitutionDirect
										? "/account/institutions/new"
										: "/institution/submission",
								),
							),
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
		onEdit: (row) => {
			if (isSubmissionRow(row)) {
				router.push(
					toLocalePath(`/account/submissions/${row.submissionId}/edit`),
				);
				return;
			}
			if (canEditInstitutionRow(row)) {
				router.push(toLocalePath(`/account/institutions/${row.id}/edit`));
				return;
			}
			if (institutionPermissions.createSubmission) {
				const institution = row;
				const baseDraft = institutionSubmissionToDraft({
					data: institution as unknown as Record<string, unknown>,
				});
				const address = baseDraft.address ?? institution.address ?? null;
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
					"address.address_suffix": address?.address_suffix ?? "",
					"address.neighbourhood": address?.neighbourhood ?? "",
					"address.cultural_area": address?.cultural_area ?? "",
					"address.lat": address?.lat ?? "",
					"address.lng": address?.lng ?? "",
				});
				router.push(toLocalePath("/institution/submission"));
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
		getCanReview: (row) =>
			isSubmissionRow(row) && canReviewSubmissionType(row.submissionType),
		reviewAriaLabel: "Review",
		emptyMessage: "No institutions found.",
	};

	return (
		<>
			<DataTable config={tableConfig} />
		</>
	);
}
