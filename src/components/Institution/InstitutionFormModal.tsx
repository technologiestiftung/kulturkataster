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
import { triggerAccountRefresh } from "@/components/Account/AccountAutoRefresh";
import { buildInstitutionFormInitialValues } from "@/lib/utils/institutionFormAdapter";
import { getAccessibleScrollBehavior } from "@/lib/utils/motion";
import {
	findPotentialInstitutionDuplicates,
	hasDuplicateInstitutionByNameAndAddress,
} from "@/lib/utils/institutionDuplicateUtils";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";
import { buildCategoryGroups } from "@/lib/utils/categoryUtils";
type InstitutionFormModalProps = {
	mode: "create" | "edit";
	institution?: Institution | null;
	currentInstitutionId?: number;
	isLoadingInstitution?: boolean;
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

const translateInstitutionFormError = (t: TFunction, errorCode: string) => {
	switch (errorCode) {
		case "notFound":
			return t("institutionFormModal.errors.notFound", {
				defaultValue: "The selected cultural venue no longer exists.",
			});
		case "forbidden":
			return t("institutionFormModal.errors.forbidden", {
				defaultValue: "You are not allowed to change this cultural venue.",
			});
		case "invalidInput":
			return t("institutionFormModal.errors.invalidInput", {
				defaultValue: "Please check the entered data and try again.",
			});
		default:
			return t("institutionFormModal.errors.unexpected", {
				defaultValue:
					"The cultural venue could not be saved. Please try again.",
			});
	}
};

const getDialogTitle = (
	mode: InstitutionFormModalProps["mode"],
	permissionContext: InstitutionFormModalProps["permissionContext"],
	t: (key: string) => string,
): string => {
	if (permissionContext === "submission") {
		return mode === "create"
			? t("institutionDraftWizardModal.dialog.submissionCreate.title")
			: t("institutionDraftWizardModal.dialog.submissionEdit.title");
	}
	return mode === "create"
		? t("institutionFormModal.dialog.title.create")
		: t("institutionFormModal.dialog.title.edit");
};

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
		const sharedPayload = buildInstitutionSharedFieldsPayload(data);

		try {
			if (mode === "create") {
				const result = await createInstitution({
					name: String(data.name ?? ""),
					address,
					categoryIds: categoryIds.length > 0 ? categoryIds : [],
					...sharedPayload,
				});
				if (!result.ok) {
					onError(result.error);
					return;
				}
				addInstitution(result.data);
			} else if (institutionId) {
				const result = await updateInstitution({
					id: institutionId,
					name: String(data.name ?? ""),
					address,
					categoryIds,
					...sharedPayload,
				});
				if (!result.ok) {
					onError(result.error);
					return;
				}
				if (result.data) {
					upsertInstitution(result.data);
				}
			}

			onSuccess(mode);
			triggerAccountRefresh(["institutions", "entityAudits"]);
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
				name: "shared_use_section",
				type: "section",
				fields: [
					{
						name: "shared_use_allowed",
						label: fieldLabel("shared_use_allowed"),
						type: "radio",
						radioVariant: "button",
						options: [
							{
								value: true,
								label: tEnum("field_names.shared_use_allowed.options.yes"),
							},
							{
								value: false,
								label: tEnum("field_names.shared_use_allowed.options.no"),
							},
						],
					},
					{
						name: "shared_use_details",
						label: t(
							"institutionFormModal.form.information.sharedUse.detailsLabel",
						),
						cardVariant: "none",
						fieldGap: "gap-0",
						type: "section",
						condition: (formData) => formData.shared_use_allowed === true,
						fields: [
							{
								name: "shared_use_info",
								collapsible: true,
								accordionVariant: "default",
								accordionTitle: t(
									"institutionFormModal.form.information.accordions.sharedUseInfo.title",
								),
								accordionDescription: t(
									"institutionFormModal.form.information.accordions.sharedUseInfo.description",
								),
								defaultOpen: false,
								type: "textarea",
								placeholder: fieldPlaceholder("shared_use_info"),
							},
							{
								name: "shared_use_equipment",
								collapsible: true,
								className: "border-t-1",
								accordionVariant: "default",
								accordionTitle: t(
									"institutionFormModal.form.information.accordions.sharedUseEquipment.title",
								),
								accordionDescription: t(
									"institutionFormModal.form.information.accordions.sharedUseEquipment.description",
								),
								defaultOpen: false,
								type: "textarea",
								placeholder: fieldPlaceholder("shared_use_equipment"),
							},
							{
								name: "shared_use_audience",
								collapsible: true,
								className: "border-t-1",
								accordionVariant: "default",
								accordionTitle: t(
									"institutionFormModal.form.information.accordions.sharedUseAudience.title",
								),
								accordionDescription: t(
									"institutionFormModal.form.information.accordions.sharedUseAudience.description",
								),
								defaultOpen: false,
								type: "textarea",
								placeholder: fieldPlaceholder("shared_use_audience"),
							},
							{
								name: "shared_use_availability",
								collapsible: true,
								className: "border-t-1",
								accordionVariant: "default",
								accordionTitle: t(
									"institutionFormModal.form.information.accordions.sharedUseAvailability.title",
								),
								accordionDescription: t(
									"institutionFormModal.form.information.accordions.sharedUseAvailability.description",
								),
								defaultOpen: false,
								type: "textarea",
								placeholder: fieldPlaceholder("shared_use_availability"),
							},
							{
								name: "accessibility",
								collapsible: true,
								className: "border-t-1",
								accordionVariant: "default",
								accordionTitle: t(
									"institutionFormModal.form.information.accordions.sharedUseAccessibility.title",
								),
								accordionDescription: t(
									"institutionFormModal.form.information.accordions.sharedUseAccessibility.description",
								),
								defaultOpen: false,
								type: "textarea",
								placeholder: fieldPlaceholder("accessibility"),
							},
							{
								name: "cost",
								className: "border-t-1",
								collapsible: true,
								accordionVariant: "default",
								accordionTitle: t(
									"institutionFormModal.form.information.accordions.sharedUseCost.title",
								),
								accordionDescription: t(
									"institutionFormModal.form.information.accordions.sharedUseCost.description",
								),
								defaultOpen: false,
								type: "textarea",
								placeholder: fieldPlaceholder("cost"),
							},
							{
								name: "shared_use_contact_person",
								className: "border-t-1",
								collapsible: true,
								accordionVariant: "default",
								accordionTitle: t(
									"institutionFormModal.form.information.accordions.sharedUseContactPerson.title",
								),
								accordionDescription: t(
									"institutionFormModal.form.information.accordions.sharedUseContactPerson.description",
								),
								defaultOpen: false,
								type: "text",
								placeholder: fieldPlaceholder("shared_use_contact_person"),
							},
						],
					},
				],
			},
			{
				name: "organization_section",
				type: "section",
				title: t("institutionFormModal.form.organization.title"),
				fieldGap: "gap-0",
				fields: [
					{
						name: "organization_type",
						collapsible: true,
						accordionVariant: "default",
						accordionTitle: t(
							"institutionFormModal.form.information.accordions.organization.title",
						),
						accordionDescription: t(
							"institutionFormModal.form.information.accordions.organization.description",
						),
						defaultOpen: false,
						type: "section",
						cardVariant: "none",
						fields: [
							{
								name: "legal_form",
								label: fieldLabel("legal_form"),
								type: "text",
								placeholder: fieldPlaceholder("legal_form"),
							},
						],
					},
					{
						name: "funding_accordion",
						collapsible: true,
						className: "border-t-1",
						accordionVariant: "default",
						accordionTitle: t(
							"institutionFormModal.form.information.accordions.funding.title",
						),
						accordionDescription: t(
							"institutionFormModal.form.information.accordions.funding.description",
						),
						defaultOpen: false,
						type: "section",
						cardVariant: "none",
						fields: [
							{
								name: "funding_type",
								allowNullOption: true,
								nullOptionLabel: tEnum("field_names.funding_type.options.none"),
								label: fieldLabel("funding_type", "Funding Type"),
								type: "select",
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
								placeholder: fieldPlaceholder("funding_type"),
							},
						],
					},
					{
						name: "funding_sources_accordion",
						collapsible: true,
						className: "border-t-1",
						accordionVariant: "default",
						accordionTitle: t(
							"institutionFormModal.form.information.accordions.fundingSources.title",
						),
						accordionDescription: t(
							"institutionFormModal.form.information.accordions.fundingSources.description",
						),
						defaultOpen: false,
						type: "section",
						cardVariant: "none",
						fields: [
							{
								name: "funding_sources",
								label: fieldLabel("funding_sources"),
								type: "fundingSources",
								allowNullOption: true,
								nullOptionLabel: tEnum(
									"field_names.funding_source.options.none",
								),
								description: fieldDescription("funding_sources"),
								fundingSources: {
									sourceLabel: fieldLabel("funding_source_name"),
									descriptionLabel: fieldLabel("funding_source_description"),
									sourcePlaceholder: fieldPlaceholder("funding_source_name"),
									descriptionPlaceholder: fieldPlaceholder(
										"funding_source_description",
									),
									addButtonLabel: tEnum(
										"field_names.funding_sources.actions.add",
									),
									removeButtonLabel: tEnum(
										"field_names.funding_sources.actions.remove",
									),
								},
							},
						],
					},
				],
			},
			{
				name: "details_section",
				title: t("institutionFormModal.form.details.title"),
				type: "section",
				fieldGap: "gap-0",
				fields: [
					{
						name: "establishment_accordion",
						collapsible: true,
						className: "border-t-1",
						accordionVariant: "default",
						accordionTitle: t(
							"institutionFormModal.form.information.accordions.establishment.title",
						),
						accordionDescription: t(
							"institutionFormModal.form.information.accordions.establishment.description",
						),
						defaultOpen: false,
						type: "section",
						cardVariant: "none",
						fields: [
							{
								name: "established_since",
								label: fieldLabel(
									"established_since",
									"Bestehen am Standort seit",
								),
								description: fieldDescription("established_since"),
								type: "date",
								placeholder: fieldPlaceholder("established_since"),
							},
							{
								name: "established_until",
								label: fieldLabel(
									"established_until",
									"Bestehen am Standort bis",
								),
								description: fieldDescription("established_until"),
								type: "date",
								placeholder: fieldPlaceholder("established_until"),
							},
						],
					},
					{
						name: "closing_accordion",
						collapsible: true,
						className: "border-t-1",
						accordionVariant: "default",
						accordionTitle: t(
							"institutionFormModal.form.information.accordions.closing.title",
						),
						accordionDescription: t(
							"institutionFormModal.form.information.accordions.closing.description",
						),
						defaultOpen: false,
						type: "section",
						cardVariant: "none",
						fields: [
							{
								name: "closing_reason",
								label: fieldLabel("closing_reason", "Schließungsgründe"),
								type: "textarea",
								placeholder: fieldPlaceholder("closing_reason"),
							},
						],
					},
					{
						name: "ownership_accordion",
						collapsible: true,
						className: "border-t-1",
						accordionVariant: "default",
						accordionTitle: t(
							"institutionFormModal.form.information.accordions.ownership.title",
						),
						accordionDescription: t(
							"institutionFormModal.form.information.accordions.ownership.description",
						),
						defaultOpen: false,
						type: "section",
						cardVariant: "none",
						fields: [
							{
								name: "owner_type",
								label: fieldLabel("owner_type", "Eigentümer*innenart"),
								type: "select",
								options: [
									{
										value: "private",
										label: tEnum("field_names.owner_type.options.private"),
									},
									{
										value: "federal_property",
										label: tEnum(
											"field_names.owner_type.options.federal_property",
										),
									},
									{
										value: "state_property",
										label: tEnum(
											"field_names.owner_type.options.state_property",
										),
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
								placeholder: fieldPlaceholder("owner_type"),
							},
							{
								name: "owner_name",
								label: fieldLabel("owner_name", "Eigentümer*in"),
								description: fieldDescription("owner_name"),
								type: "text",
								placeholder: fieldPlaceholder("owner_name"),
							},
						],
					},
					{
						name: "rental_accordion",
						collapsible: true,
						className: "border-t-1",
						accordionVariant: "default",
						accordionTitle: t(
							"institutionFormModal.form.information.accordions.rental.title",
						),
						accordionDescription: t(
							"institutionFormModal.form.information.accordions.rental.description",
						),
						defaultOpen: false,
						type: "section",
						cardVariant: "none",
						fields: [
							{
								name: "rental_contract_type",
								label: fieldLabel("rental_contract_type", "Vertragsform"),
								type: "select",
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
										value: "hereditary_building_right",
										label: tEnum(
											"field_names.rental_contract_type.options.hereditary_building_right",
										),
									},
									{
										value: "organization_ownership",
										label: tEnum(
											"field_names.rental_contract_type.options.organization_ownership",
										),
									},
								],
								placeholder: fieldPlaceholder("rental_contract_type"),
							},
							{
								name: "rental_contract_end",
								label: fieldLabel("rental_contract_end", "Vertragsende"),
								type: "date",
								condition: (formData) =>
									formData.rental_contract_type === "limited_lease",
								placeholder: fieldPlaceholder("rental_contract_end"),
							},
						],
					},
					{
						name: "protection_accordion",
						collapsible: true,
						className: "border-t-1",
						accordionVariant: "default",
						accordionTitle: t(
							"institutionFormModal.form.information.accordions.protection.title",
						),
						accordionDescription: t(
							"institutionFormModal.form.information.accordions.protection.description",
						),
						defaultOpen: false,
						type: "section",
						cardVariant: "none",
						fields: [
							{
								name: "protection_status",
								label: fieldLabel("protection_status", "Sicherungsstatus"),
								allowNullOption: true,
								nullOptionLabel: tEnum(
									"field_names.protection_status.options.none",
								),
								type: "select",
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
										label: tEnum(
											"field_names.protection_status.options.uncertain",
										),
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
								placeholder: fieldPlaceholder("protection_status"),
							},
							{
								name: "protection_status_info",
								label: fieldLabel(
									"protection_status_info",
									"Sicherungsstatus Detailinfos",
								),
								type: "textarea",
								placeholder: fieldPlaceholder("protection_status_info"),
							},
							{
								name: "protection_status_internal_notes",
								label: fieldLabel(
									"protection_status_internal_notes",
									"Sicherungsstatus Interne Notizen",
								),
								type: "textarea",
								placeholder: fieldPlaceholder(
									"protection_status_internal_notes",
								),
							},
						],
					},
					{
						name: "space_accordion",
						collapsible: true,
						className: "border-t-1",
						accordionVariant: "default",
						accordionTitle: t(
							"institutionFormModal.form.information.accordions.space.title",
						),
						accordionDescription: t(
							"institutionFormModal.form.information.accordions.space.description",
						),
						defaultOpen: false,
						type: "section",
						cardVariant: "none",
						fields: [
							{
								name: "area",
								label: fieldLabel("area", "Nutzfläche in m²"),
								type: "number",
								placeholder: fieldPlaceholder("area"),
							},
							{
								name: "number_of_rooms",
								label: fieldLabel("number_of_rooms", "Anzahl der Arbeitsräume"),
								type: "number",
								placeholder: fieldPlaceholder("number_of_rooms"),
							},
							{
								name: "capacity",
								label: fieldLabel("capacity", "Kapazität"),
								type: "number",
								placeholder: fieldPlaceholder("capacity"),
							},
						],
					},
				],
			},
			{
				name: "additional_section",
				type: "section",
				fields: [
					{
						name: "source",
						label: fieldLabel("source", "Datenquelle"),
						type: "text",
						placeholder: fieldPlaceholder("source"),
						description: fieldDescription("source"),
					},
					{
						name: "notes",
						label: fieldLabel("notes", "Notizen"),
						type: "textarea",
						placeholder: fieldPlaceholder("notes"),
						description: fieldDescription("notes"),
					},
					{
						name: "internal_notes",
						label: fieldLabel("internal_notes", "Interne Notizen"),
						type: "textarea",
						placeholder: fieldPlaceholder("internal_notes"),
						description: fieldDescription("internal_notes"),
						privateDescription: t(
							"institutionFormModal.form.information.internalNotesPrivateDescription",
						),
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
		initialValues: buildInstitutionFormInitialValues(
			resolvedInstitution,
			categoryGroups,
		),
	};
};

export function InstitutionFormModal({
	mode,
	institution,
	currentInstitutionId,
	isLoadingInstitution = false,
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
	const accountCategories = useAccountStore((state) => state.categories);
	const institutionFieldPermissions = useAccountStore(
		(state) => state.institutionFieldPermissions,
	);
	const institutionCategories = useInstitutionStore(
		(state) => state.categories,
	);
	const categoryGroups = useMemo(
		() =>
			institutionCategories?.length
				? institutionCategories
				: buildCategoryGroups(accountCategories),
		[institutionCategories, accountCategories],
	);
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
	const resolvedCurrentInstitutionId =
		currentInstitutionId ?? resolvedInstitutionWithFallback?.id;
	const initialFormValues = useMemo(
		() =>
			buildInstitutionFormInitialValues(
				resolvedInstitutionWithFallback,
				categoryGroups,
			),
		[resolvedInstitutionWithFallback, categoryGroups],
	);
	const [currentFormData, setCurrentFormData] =
		useState<Record<string, unknown>>(initialFormValues);
	const showNotFoundWithFallback =
		mode === "edit" &&
		!isLoadingInstitution &&
		!resolvedInstitutionWithFallback &&
		!isDeleting;

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
		categoryGroups,
		resolvedClose,
		handleSuccess,
		shouldRefresh,
		(errorCode) => setSubmitError(translateInstitutionFormError(t, errorCode)),
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
		"institutionFormModal.form.details.validation.duplicateInstitution",
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
				currentInstitutionId: resolvedCurrentInstitutionId,
			});
			return hasDuplicate ? duplicateInstitutionMessage : undefined;
		},
		[
			allInstitutions,
			currentFormData,
			duplicateInstitutionMessage,
			resolvedCurrentInstitutionId,
		],
	);
	const potentialDuplicates = useMemo(() => {
		const hasHardDuplicate = hasDuplicateInstitutionByNameAndAddress({
			formData: currentFormData,
			institutions: allInstitutions,
			currentInstitutionId: resolvedCurrentInstitutionId,
		});
		if (hasHardDuplicate) return [];
		return findPotentialInstitutionDuplicates({
			formData: currentFormData,
			institutions: allInstitutions,
			currentInstitutionId: resolvedCurrentInstitutionId,
			maxResults: 3,
		});
	}, [allInstitutions, currentFormData, resolvedCurrentInstitutionId]);
	const localePrefix = i18n?.resolvedLanguage === "en" ? "en" : "de";
	const duplicateWarningText = useMemo(() => {
		if (potentialDuplicates.length === 0) return null;
		const warningText = t(
			"institutionFormModal.form.details.validation.duplicatePossible",
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
				categoryGroups,
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
			categoryGroups,
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
		(isLoadingInstitution ||
			(!resolvedInstitutionWithFallback && !showNotFoundWithFallback));

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
			title={getDialogTitle(mode, permissionContext, t)}
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
					<DialogTitle className="title">
						{getDialogTitle(mode, permissionContext, t)}
					</DialogTitle>
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
