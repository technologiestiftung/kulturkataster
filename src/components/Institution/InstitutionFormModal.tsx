"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFieldLabel } from "@/lib/i18n/fieldLabels";
import { DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/Modals/Modal";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig, FieldConfig } from "@/components/FormWrapper";
import { useAccountStore } from "@/lib/store/accountStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import {
	buildInstitutionAddressPayload,
	buildInstitutionSharedFieldsPayload,
	getSubmitLabel,
	handleAddressBlur,
	handleLatLngBlur,
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
import { useInstitutionPrivateFieldResolver } from "@/lib/hooks/useInstitutionPrivateFieldResolver";
import { applyInstitutionFieldAccess } from "@/lib/utils/institutionFieldAccess";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { buildInstitutionFormInitialValues } from "@/lib/utils/institutionFormAdapter";
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
	formConfig: FormWrapperConfig,
	formKey: string | number,
) => <FormWrapper key={formKey} config={formConfig} />;

const useInstitutionSubmit = (
	mode: InstitutionFormModalProps["mode"],
	institutionId: number | undefined,
	addressId: number | undefined,
	categoryGroups: Category[],
	onClose: () => void,
	onSuccess: (mode: InstitutionFormModalProps["mode"]) => void,
	shouldRefresh: boolean,
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
	onCancel: () => void;
	onAddressBlur?: (
		value: unknown,
		formData: Record<string, unknown>,
		updateField: (name: string, value: unknown) => void,
	) => void | Promise<void>;
	onLatLngBlur?: (
		value: unknown,
		formData: Record<string, unknown>,
		updateField: (name: string, value: unknown) => void,
	) => void | Promise<void>;
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
	onCancel,
	onAddressBlur,
	onLatLngBlur,
	isPrivateField,
}: InstitutionFormConfigArgs): FormWrapperConfig => {
	const fieldLabel = (key: string, fallback: string) =>
		getFieldLabel(tEnum, key, fallback);
	return {
		fields: [
			{
				name: "details",
				type: "section",
				title: t("institutionFormModal.form.details.title"),
				description:
					mode === "create"
						? t("institutionFormModal.form.details.description.create")
						: t("institutionFormModal.form.details.description.edit"),
				layout: { columns: 2 },
				fields: [
					{
						name: "parent_organization",
						label: fieldLabel("parent_organization", "Parent Organization"),
						type: "text",
						description: t(
							"institutionFormModal.form.details.fields.parentOrganization.description",
						),
						placeholder: t(
							"institutionFormModal.form.details.fields.parentOrganization.placeholder",
						),
						layout: { span: "full" },
					},
					{
						name: "name",
						label: fieldLabel("name", "Name"),
						type: "text",
						required: true,
						placeholder: t(
							"institutionFormModal.form.details.fields.name.placeholder",
						),
						layout: { span: "full" },
					},
					{
						name: "categoryFilters",
						label: "Categories",
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
							selectionEmptyLabel: t(
								"institutionFormModal.form.details.fields.categories.placeholder",
							),
						},
					},
					{
						name: "utilization_status",
						label: fieldLabel("utilization_status", "Utilization Status"),
						type: "select",
						placeholder: tEnum("utilization_status.placeholder"),
						layout: { span: "full" },
						options: [
							{
								value: "in_use",
								label: tEnum("utilization_status.in_use"),
							},
							{
								value: "permanently_closed",
								label: tEnum("utilization_status.permanently_closed"),
							},
							{
								value: "planned_use",
								label: tEnum("utilization_status.planned_use"),
							},
							{
								value: "potential_space",
								label: tEnum("utilization_status.potential_space"),
							},
							{
								value: "temporarily_closed",
								label: tEnum("utilization_status.temporarily_closed"),
							},
							{
								value: "unknown",
								label: tEnum("utilization_status.unknown"),
							},
						],
					},
					{
						name: "address.map",
						label: `${fieldLabel("address", "Address")} Map`,
						type: "addressMap",
						layout: { span: "full" },
						addressMap: {
							latField: "address.lat",
							lngField: "address.lng",
							streetField: "address.streetLine",
							cityField: "address.city",
							zipField: "address.zip",
						},
					},

					{
						name: "address.lat",
						label: fieldLabel("lat", "Breitengrad"),
						type: "number",
						layout: { span: "half" },
						onBlur: onLatLngBlur,
					},
					{
						name: "address.lng",
						label: fieldLabel("lng", "Längengrad"),
						type: "number",
						layout: { span: "half" },
						onBlur: onLatLngBlur,
					},
					{
						name: "address.streetLine",
						label: `${fieldLabel("street", "Street")} & ${fieldLabel(
							"street_number",
							"Number",
						)}`,
						type: "text",
						layout: { span: "half" },
						placeholder: t(
							"institutionFormModal.form.details.fields.address.streetLine.placeholder",
						),
						onBlur: onAddressBlur,
					},
					{
						name: "address.zip",
						label: fieldLabel("address.zip", "ZIP Code"),
						type: "text",
						layout: { span: "half" },
						placeholder: t(
							"institutionFormModal.form.details.fields.address.zip.placeholder",
						),
						onBlur: onAddressBlur,
					},
					{
						name: "address.address_suffix",
						label: fieldLabel("address.address_suffix", "Address Suffix"),
						type: "text",
						placeholder: t(
							"institutionFormModal.form.details.fields.address.address_suffix.placeholder",
						),
					},
					{
						name: "address.neighbourhood",
						label: fieldLabel("address.neighbourhood", "Neighbourhood"),
						type: "text",
						layout: { span: "half" },
						placeholder: t(
							"institutionFormModal.form.details.fields.address.neighbourhood.placeholder",
						),
					},
					{
						name: "address.city",
						label: fieldLabel("address.city", "City"),
						type: "text",
						layout: { span: "half" },
						placeholder: t(
							"institutionFormModal.form.details.fields.address.city.placeholder",
						),
						onBlur: onAddressBlur,
					},
					{
						name: "address.cultural_area",
						label: fieldLabel("address.cultural_area", "Cultural Area"),
						type: "text",
						placeholder: t(
							"institutionFormModal.form.details.fields.address.cultural_areal.placeholder",
						),
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
						type: "text",
						placeholder: t(
							"institutionFormModal.form.contact.fields.website.placeholder",
						),
						layout: { span: "full" },
					},
					{
						name: "email",
						label: fieldLabel("email", "Email"),
						type: "email",
						placeholder: t(
							"institutionFormModal.form.contact.fields.email.placeholder",
						),
						layout: { span: "full" },
					},
					{
						name: "phone",
						label: fieldLabel("phone", "Phone"),
						type: "tel",
						placeholder: t(
							"institutionFormModal.form.contact.fields.phone.placeholder",
						),
						layout: { span: "full" },
					},
					{
						name: "contact_person_first_name",
						label: fieldLabel(
							"contact_person_first_name",
							"Contact Person First Name",
						),
						type: "text",
						placeholder: "e.g. Max",
						layout: { span: "half" },
					},
					{
						name: "contact_person_last_name",
						label: fieldLabel(
							"contact_person_last_name",
							"Contact Person Last Name",
						),
						type: "text",
						placeholder: "e.g. Mustermann",
						layout: { span: "half" },
					},
					{
						name: "contact_person_email",
						label: fieldLabel("contact_person_email", "Contact Person Email"),
						type: "email",
						placeholder: "e.g. max.mustermann@example.com",
						layout: { span: "half" },
					},
					{
						name: "contact_person_phone",
						label: fieldLabel("contact_person_phone", "Contact Person Phone"),
						type: "tel",
						placeholder: "e.g. +49 30 1234567",
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
						placeholder: "e.g. e.V., gGmbH, GbR",
						layout: { span: "full" },
					},
					{
						name: "owner_type",
						label: fieldLabel("owner_type", "Owner Type"),
						type: "select",
						placeholder: tEnum("owner_type.placeholder"),
						layout: { span: "half" },
						options: [
							{
								value: "private",
								label: tEnum("owner_type.private"),
							},
							{
								value: "federal_property",
								label: tEnum("owner_type.federal_property"),
							},
							{
								value: "state_property",
								label: tEnum("owner_type.state_property"),
							},
							{
								value: "state_property_silb",
								label: tEnum("owner_type.state_property_silb"),
							},
							{
								value: "state_property_soda",
								label: tEnum("owner_type.state_property_soda"),
							},
							{
								value: "state_property_other",
								label: tEnum("owner_type.state_property_other"),
							},
							{
								value: "state_property_specialized",
								label: tEnum("owner_type.state_property_specialized"),
							},
							{
								value: "state_property_fund",
								label: tEnum("owner_type.state_property_fund"),
							},
							{
								value: "district_property",
								label: tEnum("owner_type.district_property"),
							},
							{
								value: "other_public_property",
								label: tEnum("owner_type.other_public_property"),
							},
							{
								value: "municipal_housing_company",
								label: tEnum("owner_type.municipal_housing_company"),
							},
							{
								value: "other",
								label: tEnum("owner_type.other"),
							},
						],
					},
					{
						name: "owner_name",
						label: fieldLabel("owner_name", "Owner Name"),
						type: "text",
						placeholder: "e.g. Organization name",
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
						placeholder: tEnum("rental_contract_type.placeholder"),
						layout: { span: "half" },
						options: [
							{
								value: "unlimited_lease",
								label: tEnum("rental_contract_type.unlimited_lease"),
							},
							{
								value: "limited_lease",
								label: tEnum("rental_contract_type.limited_lease"),
							},
							{
								value: "organization_ownership",
								label: tEnum("rental_contract_type.organization_ownership"),
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
						placeholder: "Reason for closure",
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
						label: fieldLabel("funding_type", "Funding Type"),
						type: "select",
						placeholder: tEnum("funding_type.placeholder"),
						layout: { span: "full" },
						options: [
							{
								value: "workspace_program",
								label: tEnum("funding_type.workspace_program"),
							},
							{
								value: "institutional_funding",
								label: tEnum("funding_type.institutional_funding"),
							},
							{
								value: "temporary_project_funding",
								label: tEnum("funding_type.temporary_project_funding"),
							},
							{
								value: "no_funding",
								label: tEnum("funding_type.no_funding"),
							},
						],
					},
					{
						name: "funding_sources",
						label: fieldLabel("funding_source_name", "Funding Sources"),
						type: "fundingSources",
						layout: { span: "full" },
						fundingSources: {
							sourceLabel: fieldLabel(
								"funding_source_name",
								"Funding Source Name",
							),
							descriptionLabel: fieldLabel(
								"funding_source_description",
								"Funding Source Description",
							),
							sourcePlaceholder: "e.g. Land, Bezirk",
							descriptionPlaceholder:
								"e.g. Funding through the Berlin workspace program since 2020, 50,000€ annually",
							addButtonLabel: "Add funding source",
							removeButtonLabel: "Remove funding source",
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
						placeholder: t(
							"institutionFormModal.form.sharedUse.fields.info.placeholder",
						),
						layout: { span: "full" },
						condition: (formData) => formData.shared_use_allowed === true,
					},
					{
						name: "shared_use_equipment",
						label: fieldLabel("shared_use_equipment", "Shared Use Equipment"),
						type: "textarea",
						placeholder: t(
							"institutionFormModal.form.sharedUse.fields.equipment.placeholder",
						),
						layout: { span: "full" },
						condition: (formData) => formData.shared_use_allowed === true,
					},
					{
						name: "shared_use_audience",
						label: fieldLabel("shared_use_audience", "Shared Use Audience"),
						type: "textarea",
						placeholder: t(
							"institutionFormModal.form.sharedUse.fields.audience.placeholder",
						),
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
						placeholder: t(
							"institutionFormModal.form.sharedUse.fields.availability.placeholder",
						),
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
						placeholder: t(
							"institutionFormModal.form.sharedUse.fields.contactPerson.placeholder",
						),
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
						placeholder: "e.g. 150",
						layout: { span: "half" },
					},
					{
						name: "capacity",
						label: fieldLabel("capacity", "Capacity"),
						type: "number",
						placeholder: "e.g. 100",
						layout: { span: "half" },
					},
					{
						name: "number_of_rooms",
						label: fieldLabel("number_of_rooms", "Number of Rooms"),
						type: "number",
						placeholder: "e.g. 5",
						layout: { span: "half" },
					},
					{
						name: "accessibility",
						label: fieldLabel("accessibility", "Accessibility"),
						type: "textarea",
						placeholder: "Accessibility information",
						layout: { span: "full" },
					},
					{
						name: "cost",
						label: fieldLabel("cost", "Cost"),
						type: "textarea",
						placeholder: "Cost information",
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
						placeholder: "Additional details about utilization status",
						layout: { span: "full" },
					},
					{
						name: "protection_status",
						label: fieldLabel("protection_status", "Protection Status"),
						type: "select",
						placeholder: tEnum("protection_status.placeholder"),
						layout: { span: "full" },
						options: [
							{
								value: "long_term_secured",
								label: tEnum("protection_status.long_term_secured"),
							},
							{
								value: "medium_term_secured",
								label: tEnum("protection_status.medium_term_secured"),
							},
							{
								value: "uncertain",
								label: tEnum("protection_status.uncertain"),
							},
							{
								value: "acutely_threatened",
								label: tEnum("protection_status.acutely_threatened"),
							},
							{
								value: "permanently_closed",
								label: tEnum("protection_status.permanently_closed"),
							},
							{
								value: "not_yet_secured",
								label: tEnum("protection_status.not_yet_secured"),
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
						placeholder: t(
							"institutionFormModal.form.details.fields.protection_status_info.placeholder",
						),
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
						placeholder: t(
							"institutionFormModal.form.additional.fields.notes.placeholder",
						),
						layout: { span: "full" },
					},
					{
						name: "internal_notes",
						label: fieldLabel("internal_notes", "Internal Notes"),
						type: "textarea",
						placeholder: t(
							"institutionFormModal.form.additional.fields.internal_notes.placeholder",
						),
						layout: { span: "full" },
						description: t(
							"institutionFormModal.form.additional.fields.internal_notes.description",
						),
					},
				],
			},
		],
		onSubmit,
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
	const { t } = useTranslation("content");
	const { t: tEnum } = useTranslation("enumMap");
	const { isPrivateField } = useInstitutionPrivateFieldResolver();
	const institutionFieldPermissions = useAccountStore(
		(state) => state.institutionFieldPermissions,
	);
	const categories = useInstitutionStore((state) => state.categories) ?? [];
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const addressGeocodeState = useRef({
		lastQuery: "",
		inflight: false,
	});
	const latLngGeocodeState = useRef({
		lastQuery: "",
		inflight: false,
	});

	useEffect(() => {
		const hash = window.location.hash.slice(1);
		if (hash) {
			setTimeout(() => {
				const element = document.getElementById(hash);
				if (element) {
					element.scrollIntoView({ behavior: "smooth", block: "center" });
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
	const showNotFoundWithFallback =
		mode === "edit" && !resolvedInstitutionWithFallback && !isDeleting;

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
	);

	const handleCustomSubmit = useCallback(
		(data: Record<string, unknown>) => {
			const maybePromise = onSubmit?.({
				data,
				institution: resolvedInstitutionWithFallback,
				mode,
			});
			if (closeOnSubmit ?? true) {
				Promise.resolve(maybePromise).then(() => resolvedClose());
			}
		},
		[
			closeOnSubmit,
			mode,
			onSubmit,
			resolvedClose,
			resolvedInstitutionWithFallback,
		],
	);

	const onAddressBlur = handleAddressBlur(addressGeocodeState, geocodeAddress);
	const onLatLngBlur = handleLatLngBlur(latLngGeocodeState, reverseGeocode);
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
				onCancel: resolvedClose,
				onAddressBlur,
				onLatLngBlur,
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
			resolvedClose,
			onAddressBlur,
			onLatLngBlur,
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
		>
			<div className="flex h-full flex-col">
				<div className="px-6 py-8 md:px-10">
					<DialogTitle className="title">{getDialogTitle(mode, t)}</DialogTitle>
				</div>
				<div className="flex-1 overflow-auto px-6 py-6 md:px-10 flex flex-col">
					{renderDialogBody(formConfigWithDelete, formKeyValue)}
				</div>
			</div>
		</Modal>
	);
}
