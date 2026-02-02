"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { useAccountStore } from "@/lib/store/accountStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import {
	buildStreetLine,
	getSubmitLabel,
	handleAddressBlur,
	handleLatLngBlur,
	splitStreetLine,
	toOptionalText,
	toOptionalNumber,
} from "@/lib/utils/formUtils";
import {
	createInstitution,
	updateInstitution,
} from "@/server/actions/institutions";
import { geocodeAddress, reverseGeocode } from "@/server/actions/maptiler";
import type { Category, FilterState } from "@/types";
import type { Institution } from "@/types/institution";
import { useRouter } from "next/navigation";
import { resolveCategoryIdsFromDraft } from "@/lib/utils/institutionCategoryUtils";
type InstitutionFormModalProps = {
	mode: "create" | "edit";
	institution?: Institution | null;
	returnTo?: string;
	onClose?: () => void;
	onSubmit?: (args: {
		data: Record<string, unknown>;
		institution?: Institution;
		mode: InstitutionFormModalProps["mode"];
	}) => void | Promise<void>;
	initialValues?: Record<string, unknown>;
	formKey?: string;
	submitLabel?: string;
	submitting?: boolean;
	closeOnSubmit?: boolean;
	shouldRefresh?: boolean;
};

const buildCategoryFilterState = (
	categories: Category[] | undefined,
): FilterState => {
	const category_keys = new Set<string>();
	const child_category_keys = new Set<string>();
	const categoryMap = new Map<number, Category>();

	(categories ?? []).forEach((category) => {
		categoryMap.set(category.id, category);
	});

	(categories ?? []).forEach((category) => {
		if (category.parent_category_id) {
			child_category_keys.add(category.key);
			const parent = categoryMap.get(category.parent_category_id);
			if (parent) {
				category_keys.add(parent.key);
			}
		} else {
			category_keys.add(category.key);
		}
	});

	return {
		district_keys: [],
		category_keys: Array.from(category_keys),
		child_category_keys: Array.from(child_category_keys),
		include_closed: false,
		status: undefined,
	};
};

const getInitialValues = (resolvedInstitution?: Institution) => {
	const address = resolvedInstitution?.address;
	return {
		name: resolvedInstitution?.name ?? "",
		parent_organization: resolvedInstitution?.parent_organization ?? "",
		internal_notes: resolvedInstitution?.internal_notes ?? "",
		"address.streetLine": buildStreetLine(
			address?.street,
			address?.street_number,
		),
		"address.city": address?.city ?? "",
		"address.zip": address?.zipcode ?? "",
		"address.address_suffix": address?.address_suffix ?? "",
		"address.neighbourhood": address?.neighbourhood ?? "",
		"address.cultural_area": address?.cultural_area ?? "",
		"address.lat": address?.lat ?? null,
		"address.lng": address?.lng ?? null,
		categoryIds:
			resolvedInstitution?.categories?.map((category) => String(category.id)) ??
			[],
		categoryFilters: buildCategoryFilterState(resolvedInstitution?.categories),
		utilization_status: resolvedInstitution?.utilization_status ?? "",
		utilization_status_info: resolvedInstitution?.utilization_status_info ?? "",
		protection_status: resolvedInstitution?.protection_status ?? "",
		protection_status_info: resolvedInstitution?.protection_status_info ?? "",
		website: resolvedInstitution?.website ?? "",
		email: resolvedInstitution?.email ?? "",
		phone: resolvedInstitution?.phone ?? "",
		contact_person_name:
			resolvedInstitution?.contact_person?.first_name &&
			resolvedInstitution?.contact_person?.last_name
				? `${resolvedInstitution.contact_person.first_name} ${resolvedInstitution.contact_person.last_name}`
				: "",
		contact_person_email: resolvedInstitution?.contact_person?.email ?? "",
		contact_person_phone: resolvedInstitution?.contact_person?.phone ?? "",
		legal_form: resolvedInstitution?.legal_form ?? "",
		funding_type: resolvedInstitution?.funding_type ?? "",
		funding_source_name: "",
		funding_source_description: "",
		owner_type: resolvedInstitution?.owner_type ?? "",
		owner_name: resolvedInstitution?.owner_name ?? "",
		rental_contract_type: resolvedInstitution?.rental_contract_type ?? "",
		rental_contract_end: resolvedInstitution?.rental_contract_end ?? null,
		established_since: resolvedInstitution?.established_since ?? null,
		established_until: resolvedInstitution?.established_until ?? null,
		closing_reason: resolvedInstitution?.closing_reason ?? "",
		area: resolvedInstitution?.area ?? null,
		capacity: resolvedInstitution?.capacity ?? null,
		number_of_rooms: resolvedInstitution?.number_of_rooms ?? null,
		accessibility: resolvedInstitution?.accessibility ?? "",
		cost: resolvedInstitution?.cost ?? "",
		notes: resolvedInstitution?.notes ?? "",
	};
};

const getDialogTitle = (
	mode: InstitutionFormModalProps["mode"],
	t: (key: string) => string,
) =>
	mode === "create"
		? t("institutionFormModal.dialog.title.create")
		: t("institutionFormModal.dialog.title.edit");

const renderNotFoundDialog = (t: (key: string) => string) => (
	<AlertDialog
		title={t("institutionFormModal.dialog.notFound.title")}
		description={t("institutionFormModal.dialog.notFound.description")}
	/>
);

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
		const streetLine = toOptionalText(data["address.streetLine"]) ?? "";
		const city = toOptionalText(data["address.city"]);
		const zipcode = toOptionalText(data["address.zip"]);
		const lat = toOptionalNumber(data["address.lat"]);
		const lng = toOptionalNumber(data["address.lng"]);
		const address_suffix = toOptionalText(data["address.address_suffix"]);
		const neighbourhood = toOptionalText(data["address.neighbourhood"]);
		const cultural_area = toOptionalText(data["address.cultural_area"]);

		const address = (() => {
			const { street, streetNumber } = splitStreetLine(streetLine);
			const nextAddress = {
				street,
				street_number: streetNumber,
				city,
				zipcode,
				lat,
				lng,
				address_suffix,
				neighbourhood,
				cultural_area,
			};
			if (addressId) {
				return { ...nextAddress, id: addressId };
			}
			return nextAddress;
		})();
		const website = toOptionalText(data.website);
		const email = toOptionalText(data.email);
		const phone = toOptionalText(data.phone);

		try {
			if (mode === "create") {
				const created = await createInstitution({
					name: String(data.name ?? ""),
					address,
					categoryIds: categoryIds.length > 0 ? categoryIds : [],
					website,
					email,
					phone,
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
	t: (key: string) => string;
	tEnum: (key: string) => string;
	categoryGroups: Category[];
	resolvedInstitution?: Institution;
	initialValues?: Record<string, unknown>;
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
};

const buildInstitutionFormConfig = ({
	mode,
	t,
	tEnum,
	categoryGroups,
	resolvedInstitution,
	initialValues,
	submitting,
	submitLabel,
	onSubmit,
	onCancel,
	onAddressBlur,
	onLatLngBlur,
}: InstitutionFormConfigArgs): FormWrapperConfig => {
	const fieldLabel = (key: string, fallback: string) => {
		const translated = tEnum(`field_names.${key}`);
		return translated === `field_names.${key}` ? fallback : translated;
	};

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
						name: "contact_person_name",
						label: fieldLabel("contact_person_name", "Contact Person Name"),
						type: "text",
						placeholder: "e.g. Max Mustermann",
						layout: { span: "full" },
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
						name: "funding_source_name",
						label: fieldLabel("funding_source_name", "Funding Source Name"),
						type: "text",
						placeholder: "e.g. Land Berlin, Bezirk Mitte",
						description:
							"e.g. Bezirk, Land Berlin, EU, Bund, Stiftung, Kirche, Privat",
						layout: { span: "full" },
					},
					{
						name: "funding_source_description",
						label: fieldLabel(
							"funding_source_description",
							"Funding Source Description",
						),
						type: "textarea",
						placeholder:
							"e.g. Funding through the Berlin workspace program since 2020, 50,000€ annually",
						description:
							"Optional: Provide additional details (e.g. funding programs, amounts, time periods)",
						layout: { span: "full" },
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
						placeholder: "Additional details about protection status",
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
						placeholder:
							"Additional information relevant to the cultural cadastre",
						layout: { span: "full" },
					},
				],
			},
		],
		onSubmit,
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
		initialValues: initialValues ?? getInitialValues(resolvedInstitution),
	};
};

export function InstitutionFormModal({
	mode,
	institution,
	returnTo,
	onClose,
	onSubmit,
	initialValues,
	formKey,
	submitLabel,
	submitting: submittingProp,
	closeOnSubmit,
	shouldRefresh = true,
}: InstitutionFormModalProps) {
	const router = useRouter();
	const { t } = useTranslation("content");
	const { t: tEnum } = useTranslation("enumMap");
	const setAlertDialog = useAccountStore((state) => state.setAlertDialog);
	const categories = useInstitutionStore((state) => state.categories) ?? [];
	const addressGeocodeState = useRef({
		lastQuery: "",
		inflight: false,
	});
	const latLngGeocodeState = useRef({
		lastQuery: "",
		inflight: false,
	});

	useEffect(() => {
		const hash = window.location.hash.slice(1); // Remove the '#'
		if (hash) {
			setTimeout(() => {
				const element = document.getElementById(hash);
				if (element) {
					element.scrollIntoView({ behavior: "smooth", block: "start" });
				}
			}, 100);
		}
	}, []);

	const handleClose = () => {
		if (onClose) {
			onClose();
			return;
		}
		if (returnTo) {
			router.replace(returnTo);
			return;
		}
		router.back();
	};

	const resolvedInstitutionWithFallback = institution ?? undefined;
	const showNotFoundWithFallback =
		mode === "edit" && !resolvedInstitutionWithFallback && !initialValues;

	const handleSuccess = (nextMode: InstitutionFormModalProps["mode"]) => {
		const keyPrefix =
			nextMode === "create"
				? "institutionFormModal.feedback.create"
				: "institutionFormModal.feedback.update";
		setAlertDialog({
			title: t(`${keyPrefix}.title`),
			description: t(`${keyPrefix}.description`),
		});
	};

	const {
		handleSubmit: handleInstitutionSubmit,
		submitting: defaultSubmitting,
	} = useInstitutionSubmit(
		mode,
		resolvedInstitutionWithFallback?.id,
		resolvedInstitutionWithFallback?.address?.id,
		categories,
		handleClose,
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
				Promise.resolve(maybePromise).then(() => handleClose());
			}
		},
		[
			closeOnSubmit,
			handleClose,
			mode,
			onSubmit,
			resolvedInstitutionWithFallback,
		],
	);

	const onAddressBlur = handleAddressBlur(addressGeocodeState, geocodeAddress);
	const onLatLngBlur = handleLatLngBlur(latLngGeocodeState, reverseGeocode);
	const resolvedSubmitting =
		onSubmit !== undefined ? (submittingProp ?? false) : defaultSubmitting;
	const resolvedSubmitHandler =
		onSubmit !== undefined ? handleCustomSubmit : handleInstitutionSubmit;

	const formConfig = useMemo(
		() =>
			buildInstitutionFormConfig({
				mode,
				t,
				tEnum,
				categoryGroups: categories,
				resolvedInstitution: resolvedInstitutionWithFallback,
				initialValues,
				submitting: resolvedSubmitting,
				submitLabel,
				onSubmit: resolvedSubmitHandler,
				onCancel: handleClose,
				onAddressBlur,
				onLatLngBlur,
			}),
		[
			mode,
			t,
			tEnum,
			categories,
			resolvedInstitutionWithFallback,
			initialValues,
			resolvedSubmitting,
			submitLabel,
			resolvedSubmitHandler,
			handleClose,
			onAddressBlur,
			onLatLngBlur,
		],
	);

	if (showNotFoundWithFallback) {
		return renderNotFoundDialog(t);
	}

	const formKeyValue = formKey ?? resolvedInstitutionWithFallback?.id ?? mode;

	return (
		<Dialog
			open
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					handleClose();
				}
			}}
		>
			<DialogContent variant="editor" showBackButton={false} className="p-0">
				<div className="flex h-full flex-col">
					<div className="px-6 py-8 md:px-10">
						<DialogTitle className="title">
							{getDialogTitle(mode, t)}
						</DialogTitle>
					</div>
					<div className="flex-1 overflow-auto px-6 py-6 md:px-10">
						{renderDialogBody(formConfig, formKeyValue)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
