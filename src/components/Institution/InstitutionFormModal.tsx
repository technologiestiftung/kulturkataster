"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFieldLabel } from "@/lib/i18n/fieldLabels";
import { DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/Modals/Modal";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";
import { FormWrapper } from "@/components/FormWrapper";
import { FormWrapperLoadingSkeleton } from "@/components/FormWrapper/FormWrapperLoadingSkeleton";
import type { FormWrapperConfig, FieldConfig } from "@/components/FormWrapper";
import { useAccountStore } from "@/lib/store/accountStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import {
	buildInstitutionAddressPayload,
	buildInstitutionSharedFieldsPayload,
	getSubmitLabel,
	handleAddressBlur,
} from "@/lib/utils/formUtils";
import {
	createInstitution,
	updateInstitution,
} from "@/server/actions/institutions";
import { geocodeAddress, reverseGeocode } from "@/server/actions/maptiler";
import type { Category } from "@/types";
import type { Institution } from "@/types/institution";
import { useRouter } from "next/navigation";
import { resolveCategoryIdsFromDraft } from "@/lib/utils/institutionCategoryUtils";
import { TFunction } from "i18next";
import type { ReactNode } from "react";
import { useInstitutionPrivateFieldResolver } from "@/lib/hooks/useInstitutionPrivateFieldResolver";
import { applyInstitutionFieldAccess } from "@/lib/utils/institutionFieldAccess";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { buildInstitutionFormInitialValues } from "@/lib/utils/institutionFormAdapter";
import { getAccessibleScrollBehavior } from "@/lib/utils/motion";
import {
	findPotentialInstitutionDuplicates,
	hasDuplicateInstitutionByNameAndAddress,
} from "@/lib/utils/institutionDuplicateUtils";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";
type InstitutionFormModalProps = {
	mode: "create" | "edit";
	institution?: Institution | null;
	onClose?: () => void;
	routePath?: string;
	returnTo?: string;
	onSubmit?: (args: {
		data: Record<string, unknown>;
		institution?: Institution;
		mode: InstitutionFormModalProps["mode"];
	}) => void | Promise<void>;
	formKey?: string;
	submitLabel?: string;
	submitting?: boolean;
	closeOnSubmit?: boolean;
	shouldRefresh?: boolean;
	onDelete?: () => void | Promise<void>;
	deleteConfig?: {
		buttonLabel?: string;
		confirmTitle?: string;
		confirmDescription?: string;
		confirmLabel?: string;
		cancelLabel?: string;
	};
	closeConfirmation?: {
		title: string;
		description: string;
		status?: "info" | "warning" | "error" | "success";
		confirmLabel?: string;
		cancelLabel?: string;
	};
	permissionContext?: "institution" | "submission";
};

const getDialogTitle = (
	mode: InstitutionFormModalProps["mode"],
	t: (key: string) => string,
) =>
	mode === "create"
		? t("institutionFormModal.dialog.title.create")
		: t("institutionFormModal.dialog.title.edit");

const renderDialogBody = (
	isWaitingForInstitution: boolean,
	formConfig: FormWrapperConfig,
	formKey: string | number,
) =>
	isWaitingForInstitution ? (
		<FormWrapperLoadingSkeleton fieldRows={8} />
	) : (
		<FormWrapper key={formKey} config={formConfig} />
	);

const useInstitutionSubmit = (
	mode: InstitutionFormModalProps["mode"],
	institutionId: number | undefined,
	addressId: number | undefined,
	categoryGroups: Category[],
	onClose: () => void,
	onSuccess: (mode: InstitutionFormModalProps["mode"]) => void,
	shouldRefresh: boolean,
	onError: (message: string) => void,
	permissionContext: InstitutionFormModalProps["permissionContext"],
) => {
	const [submitting, setSubmitting] = useState(false);
	const addInstitution = useAccountStore((state) => state.addInstitution);
	const upsertInstitution = useAccountStore((state) => state.upsertInstitution);
	const router = useRouter();

	const handleSubmit = async (data: Record<string, unknown>) => {
		if (submitting) return;
		setSubmitting(true);

		const categoryIds = resolveCategoryIdsFromDraft(
			data as Record<string, unknown>,
			categoryGroups,
		);
		const address = buildInstitutionAddressPayload(data, { addressId });
		const {
			website,
			email,
			phone,
			funding_type: rawFundingType,
			funding_sources,
			shared_use_allowed,
			shared_use_info,
			shared_use_equipment,
			shared_use_audience,
			shared_use_availability,
			shared_use_contact_person,
		} = buildInstitutionSharedFieldsPayload(data);
		const funding_type = rawFundingType as
			| Institution["funding_type"]
			| undefined;

		try {
			if (mode === "create") {
				const created = await createInstitution({
					name: String(data.name ?? ""),
					address,
					categoryIds: categoryIds.length > 0 ? categoryIds : [],
					website,
					email,
					phone,
					funding_type: funding_type ?? null,
					funding_sources,
					shared_use_allowed,
					shared_use_info,
					shared_use_equipment,
					shared_use_audience,
					shared_use_availability,
					shared_use_contact_person,
				});
				addInstitution(created);
			} else if (institutionId) {
				const updated = await updateInstitution({
					id: institutionId,
					name: String(data.name ?? ""),
					address,
					categoryIds,
					website,
					email,
					phone,
					funding_type: funding_type ?? null,
					funding_sources,
					shared_use_allowed,
					shared_use_info,
					shared_use_equipment,
					shared_use_audience,
					shared_use_availability,
					shared_use_contact_person,
				});
				if (updated) {
					upsertInstitution(updated);
				}
			}

			onSuccess(mode);
			if (shouldRefresh) {
				router.refresh();
			}
			onClose();
		} catch (error) {
			reportClientTelemetry({
				level: "error",
				event: "institution.form.submit_failed",
				error,
				metadata: {
					mode,
					institution_id: institutionId,
					address_id: addressId,
					category_count: categoryIds.length,
					permission_context: permissionContext,
				},
			});
			const message =
				error instanceof Error
					? error.message
					: "An unexpected error occurred. Please try again.";
			onError(message);
		} finally {
			setSubmitting(false);
		}
	};

	return { handleSubmit, submitting };
};

type InstitutionFormConfigArgs = {
	mode: InstitutionFormModalProps["mode"];
	t: TFunction;
	tEnum: TFunction;
	categoryGroups: Category[];
	resolvedInstitution?: Institution;
	submitting: boolean;
	submitLabel?: string;
	onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
	onChange?: (data: Record<string, unknown>) => void;
	onCancel: () => void;
	onAddressBlur?: (
		value: unknown,
		formData: Record<string, unknown>,
		updateField: (name: string, value: unknown) => void,
	) => void | Promise<void>;
	validateDuplicateInstitution?: (
		formData: Record<string, unknown>,
	) => string | undefined;
	duplicateWarningText?: ReactNode;
	isPrivateField?: (field: FieldConfig) => boolean;
};

const buildInstitutionFormConfig = ({
	mode,
	t,
	tEnum,
	categoryGroups,
	resolvedInstitution,
	submitting,
	submitLabel,
	onSubmit,
	onChange,
	onCancel,
	onAddressBlur,
	validateDuplicateInstitution,
	duplicateWarningText,
	isPrivateField,
}: InstitutionFormConfigArgs): FormWrapperConfig => {
	const fieldLabel = (key: string, _fallback?: string) =>
		getFieldLabel(tEnum, key);
	const fieldDescription = (key: string) =>
		tEnum(`field_names.${key}.description`);
	const fieldPlaceholder = (key: string) =>
		tEnum(`field_names.${key}.placeholder`);
	return {
		fields: [
			{
				name: "details",
				type: "section",
				layout: { columns: 2 },
				fields: [
					{
						name: "parent_organization",
						label: fieldLabel("parent_organization"),
						type: "text",
						description: fieldDescription("parent_organization"),
						placeholder: fieldPlaceholder("parent_organization"),
						layout: { span: "full" },
					},
					{
						name: "name",
						label: fieldLabel("name", "Name"),
						type: "text",
						required: true,
						placeholder: fieldPlaceholder("name"),
						layout: { span: "full" },
						validators: [
							(_value, formData) => validateDuplicateInstitution?.(formData),
						],
						afterField: duplicateWarningText,
					},
					{
						name: "categoryFilters",
						fieldMetaKey: "categories",
						label: fieldLabel("categories"),
						type: "filterPanel",
						layout: { span: "full" },
						filterPanel: {
							categoryGroups,
							districts: [],
							collapsible: true,
							defaultCollapsed: true,
							categorySectionMode: "selection",
							showSummary: false,
							showDistricts: false,
							showClosedToggle: false,
							selectionEmptyLabel: fieldPlaceholder("categories"),
						},
					},
					{
						name: "utilization_status",
						label: fieldLabel("utilization_status", "Utilization Status"),
						type: "select",
						allowNullOption: true,
						nullOptionLabel: tEnum(
							"field_names.utilization_status.options.none",
						),
						description: fieldDescription("utilization_status"),
						placeholder: fieldPlaceholder("utilization_status"),
						layout: { span: "full" },
						options: [
							{
								value: "in_use",
								label: tEnum("field_names.utilization_status.options.in_use"),
							},
							{
								value: "permanently_closed",
								label: tEnum(
									"field_names.utilization_status.options.permanently_closed",
								),
							},
							{
								value: "planned_use",
								label: tEnum(
									"field_names.utilization_status.options.planned_use",
								),
							},
							{
								value: "potential_space",
								label: tEnum(
									"field_names.utilization_status.options.potential_space",
								),
							},
							{
								value: "temporarily_closed",
								label: tEnum(
									"field_names.utilization_status.options.temporarily_closed",
								),
							},
							{
								value: "unknown",
								label: tEnum("field_names.utilization_status.options.unknown"),
							},
						],
					},
					{
						name: "address.map",
						fieldMetaKey: "address_map",
						label: fieldLabel("address_map"),
						type: "addressMap",
						layout: { span: "full" },
						addressMap: {
							latField: "address.lat",
							lngField: "address.lng",
							streetField: "address.streetLine",
							cityField: "address.city",
							zipField: "address.zip",
							districtField: "address.district",
							neighbourhoodField: "address.neighbourhood",
						},
					},

					{
						name: "address.lat",
						fieldMetaKey: "lat",
						label: fieldLabel("lat", "Breitengrad"),
						type: "number",
						layout: { span: "half" },
					},
					{
						name: "address.lng",
						fieldMetaKey: "lng",
						label: fieldLabel("lng", "Längengrad"),
						type: "number",
						layout: { span: "half" },
					},
					{
						name: "address.streetLine",
						fieldMetaKey: "street",
						label: `${fieldLabel("street", "Street")} & ${fieldLabel(
							"street_number",
							"Number",
						)}`,
						type: "text",
						placeholder: fieldPlaceholder("street"),
						onBlur: onAddressBlur,
						layout: { span: "full" },
						validators: [
							(_value, formData) => validateDuplicateInstitution?.(formData),
						],
						afterField: duplicateWarningText,
					},
					{
						name: "address.address_suffix",
						fieldMetaKey: "address_suffix",
						label: fieldLabel("address_suffix", "Address Suffix"),
						type: "text",
						layout: { span: "full" },
						placeholder: fieldPlaceholder("address_suffix"),
					},
					{
						name: "address.zip",
						fieldMetaKey: "zipcode",
						label: fieldLabel("zipcode", "ZIP Code"),
						type: "text",
						layout: { span: "half" },
						placeholder: fieldPlaceholder("zipcode"),
						onBlur: onAddressBlur,
					},
					{
						name: "address.city",
						fieldMetaKey: "city",
						label: fieldLabel("city", "City"),
						type: "text",
						layout: { span: "half" },
						placeholder: fieldPlaceholder("city"),
						onBlur: onAddressBlur,
					},
					{
						name: "address.neighbourhood",
						fieldMetaKey: "neighbourhood",
						label: fieldLabel("neighbourhood", "Neighbourhood"),
						type: "text",
						layout: { span: "half" },
						placeholder: fieldPlaceholder("neighbourhood"),
					},
					{
						name: "address.district",
						fieldMetaKey: "district",
						label: fieldLabel("district", "District"),
						type: "text",
						layout: { span: "half" },
						placeholder: fieldPlaceholder("district"),
					},
					{
						name: "address.cultural_area",
						fieldMetaKey: "cultural_area",
						label: fieldLabel("cultural_area", "Cultural Area"),
						type: "text",
						layout: { span: "full" },
						placeholder: fieldPlaceholder("cultural_area"),
					},
				],
			},
			{
				name: "contact",
				type: "section",
				layout: { columns: 2 },
				title: t("institutionFormModal.form.contact.title"),
				fields: [
					{
						name: "website",
						label: fieldLabel("website", "Website"),
						type: "url",
						placeholder: fieldPlaceholder("website"),
						layout: { span: "full" },
					},
					{
						name: "email",
						label: fieldLabel("email", "Email"),
						type: "email",
						placeholder: fieldPlaceholder("email"),
						layout: { span: "full" },
					},
					{
						name: "phone",
						label: fieldLabel("phone", "Phone"),
						type: "tel",
						placeholder: fieldPlaceholder("phone"),
						layout: { span: "full" },
					},
					{
						name: "contact_person_first_name",
						label: fieldLabel(
							"contact_person_first_name",
							"Contact Person First Name",
						),
						type: "text",
						placeholder: fieldPlaceholder("contact_person_first_name"),
						layout: { span: "half" },
					},
					{
						name: "contact_person_last_name",
						label: fieldLabel(
							"contact_person_last_name",
							"Contact Person Last Name",
						),
						type: "text",
						placeholder: fieldPlaceholder("contact_person_last_name"),
						layout: { span: "half" },
					},
					{
						name: "contact_person_email",
						label: fieldLabel("contact_person_email", "Contact Person Email"),
						type: "email",
						placeholder: fieldPlaceholder("contact_person_email"),
						layout: { span: "half" },
					},
					{
						name: "contact_person_phone",
						label: fieldLabel("contact_person_phone", "Contact Person Phone"),
						type: "tel",
						placeholder: fieldPlaceholder("contact_person_phone"),
						layout: { span: "half" },
					},
				],
			},
			{
				name: "organization",
				layout: { columns: 2 },
				type: "section",
				title: t("institutionFormModal.form.organization.title"),
				fields: [
					{
						name: "legal_form",
						label: fieldLabel("legal_form", "Legal Form"),
						type: "text",
						placeholder: fieldPlaceholder("legal_form"),
						layout: { span: "full" },
					},
					{
						name: "owner_type",
						label: fieldLabel("owner_type", "Owner Type"),
						type: "select",
						placeholder: fieldPlaceholder("owner_type"),
						allowNullOption: true,
						nullOptionLabel: tEnum("field_names.owner_type.options.none"),
						layout: { span: "half" },
						options: [
							{
								value: "private",
								label: tEnum("field_names.owner_type.options.private"),
							},
							{
								value: "federal_property",
								label: tEnum("field_names.owner_type.options.federal_property"),
							},
							{
								value: "state_property",
								label: tEnum("field_names.owner_type.options.state_property"),
							},
							{
								value: "state_property_silb",
								label: tEnum(
									"field_names.owner_type.options.state_property_silb",
								),
							},
							{
								value: "state_property_soda",
								label: tEnum(
									"field_names.owner_type.options.state_property_soda",
								),
							},
							{
								value: "state_property_other",
								label: tEnum(
									"field_names.owner_type.options.state_property_other",
								),
							},
							{
								value: "state_property_specialized",
								label: tEnum(
									"field_names.owner_type.options.state_property_specialized",
								),
							},
							{
								value: "state_property_fund",
								label: tEnum(
									"field_names.owner_type.options.state_property_fund",
								),
							},
							{
								value: "district_property",
								label: tEnum(
									"field_names.owner_type.options.district_property",
								),
							},
							{
								value: "other_public_property",
								label: tEnum(
									"field_names.owner_type.options.other_public_property",
								),
							},
							{
								value: "municipal_housing_company",
								label: tEnum(
									"field_names.owner_type.options.municipal_housing_company",
								),
							},
							{
								value: "other",
								label: tEnum("field_names.owner_type.options.other"),
							},
						],
					},
					{
						name: "owner_name",
						label: fieldLabel("owner_name", "Owner Name"),
						type: "text",
						placeholder: fieldPlaceholder("owner_name"),
						layout: { span: "half" },
					},
					{
						name: "established_since",
						label: fieldLabel("established_since", "Established Since"),
						type: "date",
						layout: { span: "half" },
					},
					{
						name: "established_until",
						label: fieldLabel("established_until", "Established Until"),
						type: "date",
						layout: { span: "half" },
					},
					{
						name: "rental_contract_type",
						label: fieldLabel("rental_contract_type", "Rental Contract Type"),
						type: "select",
						placeholder: fieldPlaceholder("rental_contract_type"),
						layout: { span: "half" },
						allowNullOption: true,
						options: [
							{
								value: "unlimited_lease",
								label: tEnum(
									"field_names.rental_contract_type.options.unlimited_lease",
								),
							},
							{
								value: "limited_lease",
								label: tEnum(
									"field_names.rental_contract_type.options.limited_lease",
								),
							},
							{
								value: "organization_ownership",
								label: tEnum(
									"field_names.rental_contract_type.options.organization_ownership",
								),
							},
							{
								value: "leasehold",
								label: tEnum(
									"field_names.rental_contract_type.options.leasehold",
								),
							},
						],
					},
					{
						name: "rental_contract_end",
						label: fieldLabel("rental_contract_end", "Rental Contract End"),
						type: "date",
						condition: (formData) =>
							formData.rental_contract_type === "limited_lease",
						layout: { span: "half" },
					},
					{
						name: "closing_reason",
						label: fieldLabel("closing_reason", "Closing Reason"),
						type: "textarea",
						placeholder: fieldPlaceholder("closing_reason"),
						layout: { span: "full" },
					},
				],
			},
			{
				name: "funding",
				type: "section",
				title: t("institutionFormModal.form.funding.title"),
				fields: [
					{
						name: "funding_type",
						allowNullOption: true,
						label: fieldLabel("funding_type", "Funding Type"),
						type: "select",
						placeholder: fieldPlaceholder("funding_type"),
						layout: { span: "full" },
						options: [
							{
								value: "workspace_program",
								label: tEnum(
									"field_names.funding_type.options.workspace_program",
								),
							},
							{
								value: "institutional_funding",
								label: tEnum(
									"field_names.funding_type.options.institutional_funding",
								),
							},
							{
								value: "temporary_project_funding",
								label: tEnum(
									"field_names.funding_type.options.temporary_project_funding",
								),
							},
							{
								value: "no_funding",
								label: tEnum("field_names.funding_type.options.no_funding"),
							},
						],
					},
					{
						name: "funding_sources",
						label: fieldLabel("funding_sources", "Funding Sources"),
						type: "fundingSources",
						layout: { span: "full" },
						allowNullOption: true,
						nullOptionLabel: tEnum("funding_source.none"),
						fundingSources: {
							sourceLabel: fieldLabel(
								"funding_source_name",
								"Funding Source Name",
							),
							descriptionLabel: fieldLabel(
								"funding_source_description",
								"Funding Source Description",
							),
							sourcePlaceholder: tEnum(
								"field_names.funding_source_name.placeholder",
							),
							descriptionPlaceholder: tEnum(
								"field_names.funding_source_description.placeholder",
							),
							addButtonLabel: tEnum("field_names.funding_sources.actions.add"),
							removeButtonLabel: tEnum(
								"field_names.funding_sources.actions.remove",
							),
						},
					},
				],
			},
			{
				name: "shared_use",
				type: "section",
				layout: { columns: 2 },
				fields: [
					{
						name: "shared_use_allowed",
						label: fieldLabel("shared_use_allowed", "Shared Use Allowed"),
						type: "radio",
						radioVariant: "button",
						layout: { span: "full" },
						options: [
							{
								value: true,
								label: t("institutionFormModal.form.sharedUse.options.yes"),
							},
							{
								value: false,
								label: t("institutionFormModal.form.sharedUse.options.no"),
							},
						],
					},
					{
						name: "shared_use_info",
						label: fieldLabel("shared_use_info", "Shared Use Info"),
						type: "textarea",
						placeholder: fieldPlaceholder("shared_use_info"),
						layout: { span: "full" },
						condition: (formData) => formData.shared_use_allowed === true,
					},
					{
						name: "shared_use_equipment",
						label: fieldLabel("shared_use_equipment", "Shared Use Equipment"),
						type: "textarea",
						placeholder: fieldPlaceholder("shared_use_equipment"),
						layout: { span: "full" },
						condition: (formData) => formData.shared_use_allowed === true,
					},
					{
						name: "shared_use_audience",
						label: fieldLabel("shared_use_audience", "Shared Use Audience"),
						type: "textarea",
						placeholder: fieldPlaceholder("shared_use_audience"),
						layout: { span: "full" },
						condition: (formData) => formData.shared_use_allowed === true,
					},
					{
						name: "shared_use_availability",
						label: fieldLabel(
							"shared_use_availability",
							"Shared Use Availability",
						),
						type: "textarea",
						placeholder: fieldPlaceholder("shared_use_availability"),
						layout: { span: "full" },
						condition: (formData) => formData.shared_use_allowed === true,
					},
					{
						name: "shared_use_contact_person",
						label: fieldLabel(
							"shared_use_contact_person",
							"Shared Use Contact Person",
						),
						type: "text",
						placeholder: fieldPlaceholder("shared_use_contact_person"),
						layout: { span: "full" },
						condition: (formData) => formData.shared_use_allowed === true,
					},
				],
			},
			{
				name: "facility",
				type: "section",
				layout: { columns: 2 },
				title: t("institutionFormModal.form.facility.title"),
				fields: [
					{
						name: "area",
						label: fieldLabel("area", "Area (m²)"),
						type: "number",
						placeholder: fieldPlaceholder("area"),
						layout: { span: "half" },
					},
					{
						name: "capacity",
						label: fieldLabel("capacity", "Capacity"),
						type: "number",
						placeholder: fieldPlaceholder("capacity"),
						layout: { span: "half" },
					},
					{
						name: "number_of_rooms",
						label: fieldLabel("number_of_rooms", "Number of Rooms"),
						type: "number",
						placeholder: fieldPlaceholder("number_of_rooms"),
						layout: { span: "full" },
					},
					{
						name: "accessibility",
						label: fieldLabel("accessibility", "Accessibility"),
						type: "textarea",
						placeholder: fieldPlaceholder("accessibility"),
						layout: { span: "full" },
					},
					{
						name: "cost",
						label: fieldLabel("cost", "Cost"),
						type: "textarea",
						placeholder: fieldPlaceholder("cost"),
						layout: { span: "full" },
					},
				],
			},
			{
				name: "status",
				type: "section",
				title: t("institutionFormModal.form.status.title"),
				fields: [
					{
						name: "utilization_status_info",
						label: fieldLabel(
							"utilization_status_info",
							"Utilization Status Info",
						),
						type: "textarea",
						placeholder: fieldPlaceholder("utilization_status_info"),
						layout: { span: "full" },
					},
					{
						name: "utilization_status_internal_notes",
						label: fieldLabel(
							"utilization_status_internal_notes",
							"Utilization Status Internal Notes",
						),
						type: "textarea",
						placeholder: fieldPlaceholder("utilization_status_internal_notes"),
						layout: { span: "full" },
					},
					{
						name: "protection_status",
						label: fieldLabel("protection_status", "Protection Status"),
						type: "select",
						allowNullOption: true,
						nullOptionLabel: tEnum(
							"field_names.protection_status.options.none",
						),
						description: fieldDescription("protection_status"),
						placeholder: fieldPlaceholder("protection_status"),
						layout: { span: "full" },
						options: [
							{
								value: "long_term_secured",
								label: tEnum(
									"field_names.protection_status.options.long_term_secured",
								),
							},
							{
								value: "medium_term_secured",
								label: tEnum(
									"field_names.protection_status.options.medium_term_secured",
								),
							},
							{
								value: "uncertain",
								label: tEnum("field_names.protection_status.options.uncertain"),
							},
							{
								value: "acutely_threatened",
								label: tEnum(
									"field_names.protection_status.options.acutely_threatened",
								),
							},
							{
								value: "permanently_closed",
								label: tEnum(
									"field_names.protection_status.options.permanently_closed",
								),
							},
							{
								value: "not_yet_secured",
								label: tEnum(
									"field_names.protection_status.options.not_yet_secured",
								),
							},
						],
					},
					{
						name: "protection_status_info",
						label: fieldLabel(
							"protection_status_info",
							"Protection Status Info",
						),
						type: "textarea",
						placeholder: fieldPlaceholder("protection_status_info"),
						layout: { span: "full" },
					},
				],
			},
			{
				name: "additional",
				type: "section",
				title: t("institutionFormModal.form.additional.title"),
				fields: [
					{
						name: "notes",
						label: fieldLabel("notes", "Notes"),
						type: "textarea",
						placeholder: fieldPlaceholder("notes"),
						layout: { span: "full" },
					},
					{
						name: "internal_notes",
						label: fieldLabel("internal_notes", "Internal Notes"),
						type: "textarea",
						placeholder: fieldPlaceholder("internal_notes"),
						layout: { span: "full" },
						description: fieldDescription("internal_notes"),
					},
				],
			},
		],
		onSubmit,
		onChange,
		isPrivateField,
		showCancel: true,
		cancelLabel: t("institutionFormModal.actions.cancel"),
		onCancel,
		submitLabel:
			submitLabel ??
			getSubmitLabel(mode, submitting, {
				create: {
					default: t("institutionFormModal.actions.create"),
					loading: t("institutionFormModal.actions.creating"),
				},
				edit: {
					default: t("institutionFormModal.actions.save"),
					loading: t("institutionFormModal.actions.saving"),
				},
			}),
		initialValues: buildInstitutionFormInitialValues(resolvedInstitution),
	};
};

export function InstitutionFormModal({
	mode,
	institution,
	returnTo,
	onClose: _onClose,
	routePath,
	onSubmit,
	formKey,
	submitLabel,
	submitting: submittingProp,
	closeOnSubmit,
	shouldRefresh = false,
	onDelete,
	deleteConfig,
	closeConfirmation,
	permissionContext = "institution",
}: InstitutionFormModalProps) {
	const { t, i18n } = useTranslation("content");
	const { t: tEnum } = useTranslation("enumMap");
	const { isPrivateField } = useInstitutionPrivateFieldResolver();
	const institutionFieldPermissions = useAccountStore(
		(state) => state.institutionFieldPermissions,
	);
	const categories = useInstitutionStore((state) => state.categories) ?? [];
	const allInstitutions =
		useInstitutionStore((state) => state.allInstitutions) ?? [];
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const addressGeocodeState = useRef({
		lastQuery: "",
		inflight: false,
	});

	useEffect(() => {
		const hash = window.location.hash.slice(1);
		if (hash) {
			setTimeout(() => {
				const element = document.getElementById(hash);
				if (element) {
					element.scrollIntoView({
						behavior: getAccessibleScrollBehavior(),
						block: "center",
					});
					if (typeof element.animate === "function") {
						element.animate(
							[
								{
									backgroundColor:
										"color-mix(in srgb, var(--color-primary-dark) 0%, transparent)",
									boxShadow:
										"0 0 0 0 color-mix(in srgb, var(--color-primary-dark) 0%, transparent)",
								},
								{
									backgroundColor:
										"color-mix(in srgb, var(--color-primary-dark) 100%, transparent)",
									boxShadow:
										"0 0 0 6px color-mix(in srgb, var(--color-primary-dark) 95%, transparent)",
								},
								{
									backgroundColor:
										"color-mix(in srgb, var(--color-primary-dark) 0%, transparent)",
									boxShadow:
										"0 0 0 0 color-mix(in srgb, var(--color-primary-dark) 0%, transparent)",
								},
							],
							{
								duration: 1000,
								iterations: 5,
								easing: "ease-in-out",
							},
						);
					}
				}
			}, 100);
		}
	}, []);

	const handleClose = useRoutedModalClose({ returnTo });
	const resolvedClose = useCallback(() => {
		if (_onClose) {
			_onClose();
			return;
		}
		handleClose();
	}, [_onClose, handleClose]);

	const resolvedInstitutionWithFallback = institution ?? undefined;
	const initialFormValues = useMemo(
		() => buildInstitutionFormInitialValues(resolvedInstitutionWithFallback),
		[resolvedInstitutionWithFallback],
	);
	const [currentFormData, setCurrentFormData] =
		useState<Record<string, unknown>>(initialFormValues);
	const showNotFoundWithFallback =
		mode === "edit" && !resolvedInstitutionWithFallback && !isDeleting;

	useEffect(() => {
		setCurrentFormData(initialFormValues);
	}, [initialFormValues]);

	const handleSuccess = (nextMode: InstitutionFormModalProps["mode"]) => {
		const keyPrefix =
			nextMode === "create"
				? "institutionFormModal.feedback.create"
				: "institutionFormModal.feedback.update";
		showSuccessToast(t(`${keyPrefix}.title`), t(`${keyPrefix}.description`));
	};

	const {
		handleSubmit: handleInstitutionSubmit,
		submitting: defaultSubmitting,
	} = useInstitutionSubmit(
		mode,
		resolvedInstitutionWithFallback?.id,
		resolvedInstitutionWithFallback?.address?.id,
		categories,
		resolvedClose,
		handleSuccess,
		shouldRefresh,
		(message) => setSubmitError(message),
		permissionContext,
	);

	const handleCustomSubmit = useCallback(
		async (data: Record<string, unknown>) => {
			try {
				await onSubmit?.({
					data,
					institution: resolvedInstitutionWithFallback,
					mode,
				});
				if (closeOnSubmit ?? true) {
					resolvedClose();
				}
			} catch (error) {
				reportClientTelemetry({
					level: "error",
					event: "institution.form.custom_submit_failed",
					error,
					metadata: {
						mode,
						institution_id: resolvedInstitutionWithFallback?.id,
						permission_context: permissionContext,
					},
				});
				const message =
					error instanceof Error
						? error.message
						: "An unexpected error occurred. Please try again.";
				setSubmitError(message);
			}
		},
		[
			closeOnSubmit,
			mode,
			onSubmit,
			permissionContext,
			resolvedClose,
			resolvedInstitutionWithFallback,
		],
	);

	const onAddressBlur = handleAddressBlur(addressGeocodeState, geocodeAddress, {
		reverseGeocode,
		districtKey: "address.district",
		neighbourhoodKey: "address.neighbourhood",
	});
	const duplicateInstitutionMessage = t(
		"institutionDraftWizardModal.form.basic.validation.duplicateInstitution",
		{
			defaultValue: "An institution with this name and address already exists.",
		},
	);

	const validateDuplicateInstitution = useCallback(
		(formData: Record<string, unknown>) => {
			const mergedFormData = { ...currentFormData, ...formData };
			const hasDuplicate = hasDuplicateInstitutionByNameAndAddress({
				formData: mergedFormData,
				institutions: allInstitutions,
				currentInstitutionId: resolvedInstitutionWithFallback?.id,
			});
			return hasDuplicate ? duplicateInstitutionMessage : undefined;
		},
		[
			allInstitutions,
			currentFormData,
			duplicateInstitutionMessage,
			resolvedInstitutionWithFallback?.id,
		],
	);
	const potentialDuplicates = useMemo(() => {
		const hasHardDuplicate = hasDuplicateInstitutionByNameAndAddress({
			formData: currentFormData,
			institutions: allInstitutions,
			currentInstitutionId: resolvedInstitutionWithFallback?.id,
		});
		if (hasHardDuplicate) return [];
		return findPotentialInstitutionDuplicates({
			formData: currentFormData,
			institutions: allInstitutions,
			currentInstitutionId: resolvedInstitutionWithFallback?.id,
			maxResults: 3,
		});
	}, [allInstitutions, currentFormData, resolvedInstitutionWithFallback?.id]);
	const localePrefix = i18n?.resolvedLanguage === "en" ? "en" : "de";
	const duplicateWarningText = useMemo(() => {
		if (potentialDuplicates.length === 0) return null;
		const warningText = t(
			"institutionDraftWizardModal.form.basic.validation.duplicatePossible",
			{
				defaultValue:
					"Possible duplicate found. Please verify before submitting.",
			},
		);
		return (
			<div className="space-y-1">
				<p className="body3 text-destructive">{warningText}</p>
				<div className="flex flex-wrap gap-2">
					{potentialDuplicates.map((item) => (
						<a
							key={item.id}
							href={`/${localePrefix}/map/institution/${item.id}`}
							target="_blank"
							rel="noreferrer"
							className="body3 text-destructive underline"
						>
							{item.name?.trim() || `#${item.id}`}
						</a>
					))}
				</div>
			</div>
		);
	}, [localePrefix, potentialDuplicates, t]);
	const resolvedSubmitting =
		onSubmit !== undefined ? (submittingProp ?? false) : defaultSubmitting;
	const resolvedSubmitHandler =
		onSubmit !== undefined ? handleCustomSubmit : handleInstitutionSubmit;
	const isPrivateFormField = useCallback(
		(field: FieldConfig) => {
			if (field.type === "section" || field.type === "actionPanel")
				return false;
			return isPrivateField(field);
		},
		[isPrivateField],
	);

	const canShowDeleteAction = Boolean(onDelete);

	const formConfig = useMemo(
		() =>
			buildInstitutionFormConfig({
				mode,
				t,
				tEnum,
				categoryGroups: categories,
				resolvedInstitution: resolvedInstitutionWithFallback,
				submitting: resolvedSubmitting,
				submitLabel,
				onSubmit: resolvedSubmitHandler,
				onChange: setCurrentFormData,
				onCancel: resolvedClose,
				onAddressBlur,
				validateDuplicateInstitution,
				duplicateWarningText,
				isPrivateField: isPrivateFormField,
			}),
		[
			mode,
			t,
			tEnum,
			categories,
			resolvedInstitutionWithFallback,
			resolvedSubmitting,
			submitLabel,
			resolvedSubmitHandler,
			setCurrentFormData,
			resolvedClose,
			onAddressBlur,
			validateDuplicateInstitution,
			duplicateWarningText,
			isPrivateFormField,
		],
	);

	const formConfigWithFieldAccess = useMemo(() => {
		const filteredFields = applyInstitutionFieldAccess({
			fields: formConfig.fields,
			mode,
			permissions:
				permissionContext === "submission" ? null : institutionFieldPermissions,
		});
		return {
			...formConfig,
			fields: filteredFields,
		};
	}, [formConfig, institutionFieldPermissions, mode, permissionContext]);

	const autoCloseError = showNotFoundWithFallback
		? {
				active: true,
				title: t("institutionFormModal.dialog.notFound.title"),
				description: t("institutionFormModal.dialog.notFound.description"),
			}
		: undefined;
	const isWaitingForInstitution =
		mode === "edit" &&
		!resolvedInstitutionWithFallback &&
		!showNotFoundWithFallback;

	const formKeyValue = formKey ?? resolvedInstitutionWithFallback?.id ?? mode;

	const handleDelete = useCallback(async () => {
		if (!onDelete || isDeleting || resolvedSubmitting) return;
		setIsDeleting(true);
		try {
			resolvedClose();
			await onDelete();
			setShowDeleteDialog(false);
		} catch {
			// Keep dialog open so the caller can surface and recover from errors.
		} finally {
			setIsDeleting(false);
		}
	}, [onDelete, isDeleting, resolvedSubmitting, resolvedClose]);

	const formConfigWithDelete = useMemo(() => {
		if (!canShowDeleteAction) return formConfigWithFieldAccess;
		return {
			...formConfigWithFieldAccess,
			deleteAction: {
				label:
					deleteConfig?.buttonLabel ?? t("institutionFormModal.delete.button"),
				onClick: () => setShowDeleteDialog(true),
				disabled: isDeleting || resolvedSubmitting,
				className: "p-0!",
			},
		};
	}, [
		canShowDeleteAction,
		formConfigWithFieldAccess,
		deleteConfig?.buttonLabel,
		t,
		isDeleting,
		resolvedSubmitting,
	]);

	return (
		<Modal
			title={getDialogTitle(mode, t)}
			variant="editor"
			hasFooter={false}
			routePath={routePath}
			returnTo={returnTo}
			onCloseRequest={resolvedClose}
			closeConfirmation={closeConfirmation}
			autoCloseError={autoCloseError}
			confirmDialog={
				showDeleteDialog && onDelete
					? {
							open: true,
							status: "warning",
							title:
								deleteConfig?.confirmTitle ??
								t("institutionFormModal.delete.confirmTitle", {
									defaultValue: "Delete institution?",
								}),
							description:
								deleteConfig?.confirmDescription ??
								t("institutionFormModal.delete.confirmDescription", {
									defaultValue: "This action cannot be undone.",
								}),
							confirmLabel:
								deleteConfig?.confirmLabel ??
								t("institutionFormModal.delete.confirm"),
							cancelLabel:
								deleteConfig?.cancelLabel ??
								t("institutionFormModal.delete.cancel", {
									defaultValue: "Cancel",
								}),
							onCancel: () => setShowDeleteDialog(false),
							onConfirm: handleDelete,
							onOpenChange: (open) => {
								if (!open) setShowDeleteDialog(false);
							},
						}
					: undefined
			}
			errorDialog={
				submitError
					? {
							open: true,
							title: t("error"),
							description: submitError,
							confirmLabel: t("close"),
							onConfirm: () => setSubmitError(null),
							onOpenChange: (open) => {
								if (!open) setSubmitError(null);
							},
						}
					: undefined
			}
		>
			<div className="flex h-full flex-col">
				<div className="px-6 py-8 md:px-10">
					<DialogTitle className="title">{getDialogTitle(mode, t)}</DialogTitle>
				</div>
				<div className="flex-1 overflow-auto px-6 py-6 md:px-10 flex flex-col">
					{renderDialogBody(
						isWaitingForInstitution,
						formConfigWithDelete,
						formKeyValue,
					)}
				</div>
			</div>
		</Modal>
	);
}
