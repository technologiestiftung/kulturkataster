"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import type { FormWrapperFieldConfig } from "@/components/FormWrapper/types";
import {
	HorizontalStepper,
	StepIndicator,
	useHorizontalStepper,
	type StepConfig,
} from "@/components/HorizontalStepper";
import { Modal } from "@/components/Modals/Modal";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getFieldLabel } from "@/lib/i18n/fieldLabels";
import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";
import { geocodeAddress, reverseGeocode } from "@/server/actions/maptiler";
import {
	buildAddressFromFormData,
	handleAddressBlur,
	handleLatLngBlur,
} from "@/lib/utils/formUtils";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useInstitutionDraftStore } from "@/lib/store/institutionDraftStore";
import { InstitutionReview } from "@/components/Institution/InstitutionReview";
import { createSubmission } from "@/server/actions/submissions";
import type { Prisma } from "@/generated/prisma";
import { SubmissionEntityType, SubmissionType } from "@/generated/prisma";
import { resolveCategoryIdsFromDraft } from "@/lib/utils/institutionCategoryUtils";
import { buildSubmissionDiff } from "@/lib/utils/submissionDiff";
import { Button } from "@/components/ui/button";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
const stepConfigs: StepConfig[] = [
	{
		id: "basic",
		icon: null,
		title: "Basic Information",
		description: "Tell us about your institution",
	},
	{
		id: "category",
		icon: null,
		title: "Categories",
		description: "Select relevant categories for your institution",
	},
	{
		id: "information",
		icon: null,
		title: "Additional Information",
		description: "Provide detailed information about your institution",
	},
	{
		id: "contact",
		icon: null,
		title: "Contact",
		description: "How can we reach you?",
	},
	{
		id: "review",
		icon: null,
		title: "Review",
		description: "Review and submit",
	},
];
const DEFAULT_CREATE_STEP_ID = stepConfigs[0]?.id ?? "basic";

const getStepValidatableFields = (
	fields: FormWrapperFieldConfig[],
	formData: Record<string, unknown>,
): FormWrapperFieldConfig[] => {
	const result: FormWrapperFieldConfig[] = [];
	fields.forEach((field) => {
		if (field.condition && !field.condition(formData)) return;
		if (field.type === "section") {
			if (field.fields) {
				result.push(...getStepValidatableFields(field.fields, formData));
			}
			return;
		}
		if (field.type === "actionPanel") return;
		result.push(field);
	});
	return result;
};

const validateStepFieldValue = (
	field: FormWrapperFieldConfig,
	value: unknown,
	formData: Record<string, unknown>,
) => {
	if (field.required) {
		if (field.type === "checkbox") {
			if (value !== true) return false;
		} else if (Array.isArray(value)) {
			if (value.length === 0) return false;
		} else if (value === undefined || value === null || value === "") {
			return false;
		}
	}

	if (field.validate && field.validate(value)) {
		return false;
	}

	if (field.validateWithForm && field.validateWithForm(value, formData)) {
		return false;
	}

	return true;
};

type InstitutionDraftWizardContentProps = {
	title?: string;
	subtitle?: string;
	onSubmitted?: () => void;
	onCloseRequest?: () => void;
};

function InstitutionDraftWizardContent({
	title,
	subtitle,
	onSubmitted,
	onCloseRequest,
}: InstitutionDraftWizardContentProps) {
	const { t } = useTranslation("content");
	const { t: tEnum } = useTranslation("enumMap");

	const fieldLabel = useCallback(
		(key: string, fallback: string) => getFieldLabel(tEnum, key, fallback),
		[tEnum],
	);

	const categories = useInstitutionStore((state) => state.categories) ?? [];
	const draft = useInstitutionDraftStore((state) => state.draft);
	const setDraft = useInstitutionDraftStore((state) => state.setDraft);
	const setStepId = useInstitutionDraftStore((state) => state.setStepId);
	const draftMode = useInstitutionDraftStore((state) => state.mode);
	const isUpdateReviewOnly = draftMode === "update";
	const [editSectionId, setEditSectionId] = useState<string | null>(null);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const hasOpenedFromHash = useRef(false);
	const draftRef = useRef(draft);
	const wizardRootRef = useRef<HTMLDivElement | null>(null);

	const {
		currentStepId,
		currentStepIndex,
		totalSteps,
		goToStep,
		nextStep,
		previousStep,
		canGoPrevious,
		setStepValidation,
	} = useHorizontalStepper();
	const stepId = useInstitutionDraftStore((state) => state.stepId);
	const stepSyncSource = useRef<"stepper" | "external" | null>(null);

	const addressGeocodeState = useRef({
		lastQuery: "",
		inflight: false,
	});
	const latLngGeocodeState = useRef({
		lastQuery: "",
		inflight: false,
	});
	const onAddressBlur = handleAddressBlur(addressGeocodeState, geocodeAddress);
	const onLatLngBlur = handleLatLngBlur(latLngGeocodeState, reverseGeocode);
	const scrollStepContainerToTop = useCallback(() => {
		if (typeof window === "undefined") return;
		const root = wizardRootRef.current;
		if (root) {
			const modalRoot = root.closest(".Modal-Root") as HTMLElement | null;
			if (modalRoot) {
				modalRoot.scrollTo({ top: 0, behavior: "auto" });
				return;
			}
		}
		window.scrollTo({ top: 0, behavior: "auto" });
	}, []);

	const handleStepChange = useCallback(
		(data: Record<string, unknown>) => {
			const nextDraft = { ...draftRef.current, ...data };
			draftRef.current = nextDraft;
			setDraft(data);
		},
		[setDraft],
	);

	const handleFinalSubmit = useCallback(
		async (data: Record<string, unknown>) => {
			const categoryIds = resolveCategoryIdsFromDraft(
				data as Record<string, unknown>,
				categories,
			);
			const { entityId, newCategory, ...rest } = data as {
				entityId?: unknown;
				newCategory?: unknown;
			};
			const resolvedEntityId =
				typeof entityId === "number" && Number.isFinite(entityId)
					? entityId
					: null;
			const canShareContactPerson = data.consent_contact_listing === true;
			if (draftMode === "update" && !resolvedEntityId) {
				throw new Error("Missing institution for update submission.");
			}
			const sanitizedRest = { ...rest } as Record<string, unknown>;
			if (!canShareContactPerson) {
				delete sanitizedRest.contact_person_first_name;
				delete sanitizedRest.contact_person_last_name;
				delete sanitizedRest.contact_person_email;
				delete sanitizedRest.contact_person_phone;
			}
			const payload: Record<string, unknown> = {
				...sanitizedRest,
				address: buildAddressFromFormData(data),
				categoryIds,
			};
			const sourceInstitution =
				draftMode === "update" && data.originalInstitution
					? (data.originalInstitution as Record<string, unknown>)
					: undefined;
			const submissionDiff =
				draftMode === "update"
					? buildSubmissionDiff(payload, sourceInstitution)
					: undefined;
			const submissionMeta =
				draftMode === "create" && data.works_for_organization === true
					? { request_claim_on_approval: true }
					: undefined;
			const institutionSubmission = await createSubmission({
				entityType: SubmissionEntityType.institution,
				entityId: draftMode === "update" ? resolvedEntityId : null,
				type:
					draftMode === "update"
						? SubmissionType.update
						: SubmissionType.create,
				status: "approval_pending",
				data: payload as Prisma.InputJsonValue,
				diff: submissionDiff as Prisma.InputJsonValue | undefined,
				meta: submissionMeta,
			});
			const proposedCategories =
				typeof newCategory === "string"
					? Array.from(
							new Set(
								newCategory
									.split(",")
									.map((value) => value.trim())
									.filter((value) => value.length > 0),
							),
						)
					: [];
			onSubmitted?.();
			if (proposedCategories.length > 0) {
				void Promise.allSettled(
					proposedCategories.map((key) =>
						createSubmission({
							entityType: SubmissionEntityType.category,
							entityId: null,
							type: SubmissionType.create,
							status: "approval_pending",
							data: { key },
							meta: {
								source: "institution_draft",
								institutionSubmissionId:
									typeof institutionSubmission?.id === "number"
										? institutionSubmission.id
										: undefined,
							},
						}),
					),
				);
			}
		},
		[categories, draftMode, onSubmitted],
	);

	const handleStepSubmit = useCallback(
		(data: Record<string, unknown>) => {
			const nextData = { ...draft, ...data };
			const address = buildAddressFromFormData(nextData);
			draftRef.current = { ...nextData, address };
			setDraft({ ...data, address });
			nextStep();
		},
		[draft, nextStep, setDraft],
	);

	const handleCancel = useCallback(() => {
		if (canGoPrevious) {
			previousStep();
			return;
		}
		onCloseRequest?.();
	}, [canGoPrevious, onCloseRequest, previousStep]);

	const clearSectionHash = useCallback(() => {
		if (typeof window === "undefined") return;
		if (!window.location.hash) return;
		const { pathname, search } = window.location;
		window.history.replaceState(null, "", `${pathname}${search}`);
	}, []);

	const closeSectionEditModal = useCallback(() => {
		clearSectionHash();
		setEditModalOpen(false);
	}, [clearSectionHash]);

	const handleSectionEditSubmit = useCallback(
		(data: Record<string, unknown>) => {
			const address = buildAddressFromFormData(data);
			setDraft({ ...data, address });
			closeSectionEditModal();
		},
		[closeSectionEditModal, setDraft],
	);

	useEffect(() => {
		stepSyncSource.current = "stepper";
		setStepId(currentStepId);
	}, [currentStepId, setStepId]);

	useEffect(() => {
		if (currentStepId !== "review" || hasOpenedFromHash.current) return;
		if (typeof window === "undefined") return;
		const hash = window.location.hash.replace("#", "").trim();
		if (hash) {
			hasOpenedFromHash.current = true;
			setEditSectionId(hash);
			setEditModalOpen(true);
		}
	}, [currentStepId]);

	useEffect(() => {
		if (!stepId || stepId === currentStepId) {
			stepSyncSource.current = null;
			return;
		}
		if (stepSyncSource.current !== "stepper") {
			stepSyncSource.current = "external";
			goToStep(stepId);
		}
		stepSyncSource.current = null;
	}, [currentStepId, goToStep, stepId]);

	const basicFormConfig: FormWrapperConfig = useMemo(
		() => ({
			formId: "institution-basic-form",
			layout: { columns: 1 },
			fields: [
				{
					name: "basicSection",
					type: "section",
					title: t("institutionDraftWizardModal.form.basic.sectionTitle"),
					layout: { columns: 2 },
					fields: [
						{
							name: "name",
							label: t("institutionDraftWizardModal.form.basic.name.label"),
							type: "text",
							layout: { span: "full" },
							placeholder: t(
								"institutionDraftWizardModal.form.basic.name.placeholder",
							),
							required: true,
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
							name: "address.lng",
							label: fieldLabel("lng", "Längengrad"),
							type: "number",
							layout: { span: "half" },
							onBlur: onLatLngBlur,
						},
						{
							name: "address.lat",
							label: fieldLabel("lat", "Breitengrad"),
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
							layout: { span: "full" },
							placeholder: t(
								"institutionFormModal.form.details.fields.address.streetLine.placeholder",
							),
							onBlur: onAddressBlur,
						},
						{
							name: "address.address_suffix",
							label: fieldLabel("address_suffix", "Address Suffix"),
							type: "text",
							layout: { span: "full" },
							placeholder: t(
								"institutionFormModal.form.details.fields.address.address_suffix.placeholder",
							),
						},
						{
							name: "address.zip",
							label: fieldLabel("zip", "ZIP Code"),
							type: "text",
							layout: { span: "half" },
							placeholder: t(
								"institutionFormModal.form.details.fields.address.zip.placeholder",
							),
							onBlur: onAddressBlur,
						},
						{
							name: "address.city",
							label: fieldLabel("city", "City"),
							type: "text",
							layout: { span: "half" },
							placeholder: t(
								"institutionFormModal.form.details.fields.address.city.placeholder",
							),
							onBlur: onAddressBlur,
						},
						{
							name: "address.neighbourhood",
							label: fieldLabel("neighbourhood", "Neighbourhood"),
							type: "text",
							layout: { span: "half" },
							placeholder: t(
								"institutionFormModal.form.details.fields.address.neighbourhood.placeholder",
							),
						},
						{
							name: "address.cultural_area",
							label: fieldLabel("cultural_area", "Cultural Area"),
							type: "text",
							placeholder: t(
								"institutionFormModal.form.details.fields.address.cultural_areal.placeholder",
							),
						},
					],
				},
				{
					name: "basicDetailsSection",
					type: "section",
					layout: { span: "full" },
					fields: [
						{
							name: "utilization_status",
							label: fieldLabel("utilization_status", "Utilization Status"),
							description:
								"Gibt an, ob eine Kultureinrichtung aktuell in Betrieb ist oder nicht.",
							type: "select",
							placeholder: tEnum("utilization_status.placeholder"),
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
							name: "utilization_status_info",
							label: t(
								"institutionDraftWizardModal.form.basic.utilizationStatusInfo.label",
							),
							type: "textarea",
							placeholder: t(
								"institutionDraftWizardModal.form.basic.utilizationStatusInfo.placeholder",
							),
						},
						{
							name: "parent_organization",
							label: fieldLabel("parent_organization", "Parent Organization"),
							description:
								"Gibt es eine übergeordnete Organisation, z. B. ein Kulturverband, eine Stiftung oder eine andere Institution?",
							type: "text",
							placeholder: t(
								"institutionFormModal.form.details.fields.parent_organization.placeholder",
							),
						},
						{
							name: "email",
							label: fieldLabel("institution_email", "Email"),
							description:
								"Bitte nach Möglichkeit eine allgemeine E-Mail-Adresse der Kultureinrichtung angeben (z. B. Info- oder Empfangskontakt). ",
							type: "email",
							placeholder: t(
								"institutionFormModal.form.details.fields.email.placeholder",
							),
						},
						{
							name: "phone",
							label: fieldLabel("institution_phone", "Phone"),
							description:
								"Bitte nach Möglichkeit eine allgemeine Telefonnummer der Kultureinrichtung angeben (z. B. Info- oder Empfangskontakt). ",
							type: "text",
							placeholder: t(
								"institutionFormModal.form.details.fields.phone.placeholder",
							),
						},
						{
							name: "website",
							label: fieldLabel("institution_website", "Website"),
							type: "text",
							placeholder: t(
								"institutionFormModal.form.details.fields.website.placeholder",
							),
						},
					],
				},
			],
			initialValues: draft,
			onChange: handleStepChange,
			onSubmit: handleStepSubmit,
			onCancel: handleCancel,
			submitLabel: t("institutionDraftWizardModal.actions.next"),
			showCancel: true,
		}),
		[
			draft,
			handleCancel,
			handleStepChange,
			handleStepSubmit,
			onAddressBlur,
			onLatLngBlur,
			fieldLabel,
			t,
			tEnum,
		],
	);

	const categoryFormConfig: FormWrapperConfig = useMemo(
		() => ({
			formId: "institution-category-form",
			fields: [
				{
					name: "categorySection",
					type: "section",
					cardVariant: "none",
					required: true,
					layout: { span: "full" },
					fields: [
						{
							name: "categoryFilters",
							type: "filterPanel",
							required: true,
							validateWithForm: (value, formData) => {
								const filters = value as
									| {
											category_keys?: string[];
											child_category_keys?: string[];
									  }
									| undefined;
								const hasSelectedCategories =
									(filters?.category_keys?.length ?? 0) > 0 ||
									(filters?.child_category_keys?.length ?? 0) > 0;
								const rawNewCategory = formData.newCategory;
								const hasProposedCategory =
									typeof rawNewCategory === "string" &&
									rawNewCategory
										.split(",")
										.map((item) => item.trim())
										.some((item) => item.length > 0);
								return hasSelectedCategories || hasProposedCategory
									? undefined
									: "Bitte wählen Sie mindestens eine Kategorie aus.";
							},
							layout: { span: "full" },
							filterPanel: {
								categoryGroups: categories,
								districts: [],
								categorySectionMode: "selection",
								showSummary: false,
								showDistricts: false,
								showClosedToggle: false,
								selectionEmptyLabel: t(
									"institutionFormModal.form.details.fields.categories.placeholder",
								),
							},
						},
					],
				},
				{
					name: "newCategorySection",
					type: "section",
					layout: { span: "full" },
					fields: [
						{
							name: "newCategory",
							label: t(
								"institutionDraftWizardModal.form.category.newCategory.label",
							),
							description: t(
								"institutionDraftWizardModal.form.category.newCategory.description",
							),
							className: "mt-4",
							type: "text",
							placeholder: t(
								"institutionDraftWizardModal.form.category.newCategory.placeholder",
							),
							layout: { span: "full" },
						},
					],
				},
			],
			initialValues: draft,
			onChange: handleStepChange,
			onSubmit: handleStepSubmit,
			onCancel: handleCancel,
			cancelLabel: t("institutionDraftWizardModal.actions.back"),
			submitLabel: t("institutionDraftWizardModal.actions.next"),
			showCancel: true,
			layout: { columns: 2 },
		}),
		[categories, draft, handleCancel, handleStepChange, handleStepSubmit, t],
	);

	const informationFormConfig: FormWrapperConfig = useMemo(
		() => ({
			formId: "institution-shared-use-form",
			fields: [
				{
					name: "shared_use_section",
					type: "section",
					fields: [
						{
							name: "shared_use",
							label: t(
								"institutionDraftWizardModal.form.information.sharedUse.label",
							),
							type: "radio",
							radioVariant: "button",
							options: [
								{
									value: "yes",
									label: t(
										"institutionDraftWizardModal.form.information.sharedUse.options.yes",
									),
								},
								{
									value: "no",
									label: t(
										"institutionDraftWizardModal.form.information.sharedUse.options.no",
									),
								},
							],
						},
						{
							name: "shared_use_details",
							label: t(
								"institutionDraftWizardModal.form.information.sharedUse.detailsLabel",
							),
							cardVariant: "none",
							fieldGap: "gap-0",
							type: "section",
							fields: [
								{
									name: "shared_use_info",
									collapsible: true,
									accordionVariant: "default",
									accordionTitle: t(
										"institutionDraftWizardModal.form.information.accordions.sharedUseInfo.title",
									),
									accordionDescription:
										"Beschreiben, welche Informationen hier eingetragen werden sollen, evtl. mit Aufzählung von Beispielen",
									defaultOpen: false,
									type: "textarea",
									placeholder: t(
										"institutionDraftWizardModal.form.information.sharedUse.infoPlaceholder",
									),
								},
								{
									name: "shared_use_equipment",
									collapsible: true,
									className: "border-t-1",
									accordionVariant: "default",
									accordionTitle: t(
										"institutionDraftWizardModal.form.information.accordions.sharedUseEquipment.title",
									),
									accordionDescription:
										"Welche Infrastruktur ist vorhanden? Gibt es Tische, Stühle, eine Küche, WLAN, Licht- und Tontechnik? Jedes Detail kann entscheidend sein.",
									defaultOpen: false,
									type: "textarea",
									placeholder: t(
										"institutionDraftWizardModal.form.information.sharedUse.equipmentPlaceholder",
									),
								},
								{
									name: "shared_use_audience",
									collapsible: true,
									className: "border-t-1",
									accordionVariant: "default",
									accordionTitle: t(
										"institutionDraftWizardModal.form.information.accordions.sharedUseAudience.title",
									),
									accordionDescription:
										'Für welche Art von Aktivitäten ist der Raum geeignet? Zum Beispiel: "geeignet für Tanzproben und Workshops" oder "ideal für Lesungen und kleine Konzerte."',
									defaultOpen: false,
									type: "textarea",
									placeholder: t(
										"institutionDraftWizardModal.form.information.sharedUse.audiencePlaceholder",
									),
								},
								{
									name: "shared_use_availability",
									collapsible: true,
									className: "border-t-1",
									accordionVariant: "default",
									accordionTitle: t(
										"institutionDraftWizardModal.form.information.accordions.sharedUseAvailability.title",
									),
									accordionDescription:
										"Wann kann der Raum genutzt werden? Sind es bestimmte Tage, Tageszeiten oder Zeiträume?",
									defaultOpen: false,
									type: "textarea",
									placeholder: t(
										"institutionDraftWizardModal.form.information.sharedUse.availabilityPlaceholder",
									),
								},
								{
									name: "shared_use_accessibility",
									collapsible: true,
									className: "border-t-1",
									accordionVariant: "default",
									accordionTitle: t(
										"institutionDraftWizardModal.form.information.accordions.sharedUseAccessibility.title",
									),
									accordionDescription:
										"Ist der Raum barrierefrei zugänglich? Welche Barrieren sind vorhanden?",
									defaultOpen: false,
									type: "textarea",
									placeholder: t(
										"institutionDraftWizardModal.form.information.sharedUse.accessibilityPlaceholder",
									),
								},
								{
									name: "shared_use_cost",
									className: "border-t-1",
									collapsible: true,
									accordionVariant: "default",
									accordionTitle: t(
										"institutionDraftWizardModal.form.information.accordions.sharedUseCost.title",
									),
									accordionDescription:
										"Wie hoch sind die Kosten für die Nutzung? Gibt es einen Stunden-, Tages- oder Wochenpreis? Sind die Kosten verhandelbar?",
									defaultOpen: false,
									type: "textarea",
									placeholder: t(
										"institutionDraftWizardModal.form.information.sharedUse.costPlaceholder",
									),
								},
								{
									name: "shared_use_contact_person",
									className: "border-t-1",
									collapsible: true,
									accordionVariant: "default",
									accordionTitle: t(
										"institutionDraftWizardModal.form.information.accordions.sharedUseContactPerson.title",
									),
									accordionDescription:
										"Geben Sie hier bitte einen Kontakt per E-Mail und/oder Telefon an. Sofern es eine Ansprechperson gibt, können Sie den Namen ebenfalls angeben. Sofern Sie hier personenbezogene Daten eintragen, beachten Sie bitte, dass Sie mit Absenden des Formulars der Veröffentlichung dieser Daten im Kulturkataster zustimmen müssen.",
									defaultOpen: false,
									type: "text",
									placeholder: t(
										"institutionDraftWizardModal.form.information.sharedUse.contactPersonPlaceholder",
									),
								},
							],
						},
					],
				},
				{
					name: "organization_section",
					type: "section",
					fieldGap: "gap-0",
					fields: [
						{
							name: "organization_type",
							collapsible: true,
							accordionVariant: "default",
							accordionTitle: t(
								"institutionDraftWizardModal.form.information.accordions.organization.title",
							),
							accordionDescription: t(
								"institutionDraftWizardModal.form.information.accordions.organization.description",
							),
							defaultOpen: false,
							type: "section",
							cardVariant: "none",
							fields: [
								{
									name: "legal_form",
									type: "text",
									placeholder: t(
										"institutionDraftWizardModal.form.information.organization.legalFormPlaceholder",
									),
								},
							],
						},
						{
							name: "funding_accordion",
							collapsible: true,
							className: "border-t-1",
							accordionVariant: "default",
							accordionTitle: t(
								"institutionDraftWizardModal.form.information.accordions.funding.title",
							),
							accordionDescription: t(
								"institutionDraftWizardModal.form.information.accordions.funding.description",
							),
							defaultOpen: false,
							type: "section",
							cardVariant: "none",
							fields: [
								{
									name: "funding_type",
									type: "select",
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
									placeholder: t(
										"institutionDraftWizardModal.form.information.selectPlaceholder",
									),
								},
							],
						},
						{
							name: "funding_sources_accordion",
							collapsible: true,
							className: "border-t-1",
							accordionVariant: "default",
							accordionTitle: t(
								"institutionDraftWizardModal.form.information.accordions.fundingSources.title",
							),
							accordionDescription:
								"Geben Sie die Finanzierungsquellen Ihrer Kultureinrichtung an.",
							defaultOpen: false,
							type: "section",
							cardVariant: "none",
							fields: [
								{
									name: "funding_sources",
									label: t(
										"institutionDraftWizardModal.form.information.fundingSources.label",
									),
									type: "fundingSources",
									description:
										"z. B. Bezirk, Land Berlin, EU, Bund, Stiftung, Kirche, Privat",
									fundingSources: {
										sourceLabel: t(
											"institutionDraftWizardModal.form.information.fundingSources.sourceLabel",
										),
										descriptionLabel: t(
											"institutionDraftWizardModal.form.information.fundingSources.descriptionLabel",
										),
										sourcePlaceholder: t(
											"institutionDraftWizardModal.form.information.fundingSources.sourcePlaceholder",
										),
										descriptionPlaceholder: t(
											"institutionDraftWizardModal.form.information.fundingSources.descriptionPlaceholder",
										),
										addButtonLabel: t(
											"institutionDraftWizardModal.form.information.fundingSources.addButtonLabel",
										),
										removeButtonLabel: t(
											"institutionDraftWizardModal.form.information.fundingSources.removeButtonLabel",
										),
									},
								},
							],
						},
					],
				},
				{
					name: "details_section",
					type: "section",
					fieldGap: "gap-0",
					fields: [
						{
							name: "establishment_accordion",
							collapsible: true,
							className: "border-t-1",
							accordionVariant: "default",
							accordionTitle: t(
								"institutionDraftWizardModal.form.information.accordions.establishment.title",
							),
							accordionDescription:
								"Zeitraum der Nutzung oder Eröffnung am Standort.",
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
									description:
										"Bitte tragen Sie das Datum der erstmaligen Nutzung oder Eröffnung am Standort ein. Falls das genaue Datum nicht bekannt ist, reicht auch die Angabe des Jahres.",
									type: "date",
									placeholder: "DD.MM.YYYY oder YYYY",
								},
								{
									name: "established_until",
									label: fieldLabel(
										"established_until",
										"Bestehen am Standort bis",
									),
									description:
										"Bitte tragen Sie das Datum ein, bis zu dem die Kultureinrichtung an diesem Standort aktiv war. Diese Angabe betrifft nur bereits geschlossene Orte. Falls das genaue Datum nicht bekannt ist, reicht auch die Angabe des Jahres.",
									type: "date",
									placeholder: "DD.MM.YYYY oder YYYY",
								},
							],
						},
						{
							name: "closing_accordion",
							collapsible: true,
							className: "border-t-1",
							accordionVariant: "default",
							accordionTitle: t(
								"institutionDraftWizardModal.form.information.accordions.closing.title",
							),
							accordionDescription:
								"Diese Angabe betrifft nur bereits geschlossene Orte.",
							defaultOpen: false,
							type: "section",
							cardVariant: "none",
							fields: [
								{
									name: "closing_reason",
									label: fieldLabel("closing_reason", "Schließungsgründe"),
									type: "textarea",
									placeholder: t(
										"institutionDraftWizardModal.form.information.closingReason.placeholder",
									),
								},
							],
						},
						{
							name: "ownership_accordion",
							collapsible: true,
							className: "border-t-1",
							accordionVariant: "default",
							accordionTitle: t(
								"institutionDraftWizardModal.form.information.accordions.ownership.title",
							),
							accordionDescription:
								"Diese Information wird ausschließlich für befugte Nutzer*innen im geschützten Bereich des Kulturkatasters zugänglich und nicht öffentlich einsehbar sein.",
							defaultOpen: false,
							type: "section",
							cardVariant: "none",
							fields: [
								{
									name: "owner_type",
									label: fieldLabel("owner_type", "Eigentümer*innenart"),
									type: "select",
									options: [
										{ value: "private", label: tEnum("owner_type.private") },
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
										{ value: "other", label: tEnum("owner_type.other") },
									],
									placeholder: t(
										"institutionDraftWizardModal.form.information.selectPlaceholder",
									),
								},
								{
									name: "owner_name",
									label: fieldLabel("owner_name", "Eigentümer*in"),
									description:
										"Bitte geben Sie den Namen der Person oder Organisation an, die Eigentümer*in des Grundstücks oder Gebäudes der Kultureinrichtung ist. Diese Information wird ausschließlich für befugte Nutzer*innen im geschützten Bereich des Kulturkatasters zugänglich und nicht öffentlich einsehbar sein.",
									type: "text",
									placeholder: t(
										"institutionDraftWizardModal.form.information.ownerName.placeholder",
									),
								},
							],
						},
						{
							name: "rental_accordion",
							collapsible: true,
							className: "border-t-1",
							accordionVariant: "default",
							accordionTitle: t(
								"institutionDraftWizardModal.form.information.accordions.rental.title",
							),
							accordionDescription:
								"Diese Information wird ausschließlich für befugte Nutzer*innen im geschützten Bereich des Kulturkatasters zugänglich und nicht öffentlich einsehbar sein.",
							defaultOpen: false,
							type: "section",
							cardVariant: "none",
							fields: [
								{
									name: "rental_contract_type",
									label: fieldLabel("rental_contract_type", "Vertragsform"),
									type: "select",
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
											value: "hereditary_building_right",
											label: t(
												"institutionDraftWizardModal.form.information.rentalContract.hereditaryBuildingRight",
											),
										},
										{
											value: "organization_ownership",
											label: tEnum(
												"rental_contract_type.organization_ownership",
											),
										},
									],
									placeholder: t(
										"institutionDraftWizardModal.form.information.selectPlaceholder",
									),
								},
								{
									name: "rental_contract_end",
									label: fieldLabel("rental_contract_end", "Vertragsende"),
									type: "date",
									placeholder: t(
										"institutionDraftWizardModal.form.information.datePlaceholder",
									),
								},
							],
						},
						{
							name: "protection_accordion",
							collapsible: true,
							className: "border-t-1",
							accordionVariant: "default",
							accordionTitle: t(
								"institutionDraftWizardModal.form.information.accordions.protection.title",
							),
							accordionDescription: t(
								"institutionDraftWizardModal.form.information.accordions.protection.description",
							),
							defaultOpen: false,
							type: "section",
							cardVariant: "none",
							fields: [
								{
									name: "protection_status",
									label: fieldLabel("protection_status", "Sicherungsstatus"),
									type: "select",
									options: [
										{
											value: "long_term_secured",
											label: t(
												"institutionDraftWizardModal.form.information.protectionStatus.longTermSecured",
											),
										},
										{
											value: "medium_term_secured",
											label: t(
												"institutionDraftWizardModal.form.information.protectionStatus.mediumTermSecured",
											),
										},
										{
											value: "uncertain",
											label: t(
												"institutionDraftWizardModal.form.information.protectionStatus.uncertain",
											),
										},
										{
											value: "acutely_threatened",
											label: t(
												"institutionDraftWizardModal.form.information.protectionStatus.acutelyThreatened",
											),
										},
										{
											value: "permanently_closed",
											label: t(
												"institutionDraftWizardModal.form.information.protectionStatus.permanentlyClosed",
											),
										},
										{
											value: "not_yet_secured",
											label: t(
												"institutionDraftWizardModal.form.information.protectionStatus.notYetSecured",
											),
										},
									],
									placeholder: t(
										"institutionDraftWizardModal.form.information.selectPlaceholder",
									),
								},
								{
									name: "protection_status_info",
									label: fieldLabel(
										"protection_status_info",
										"Sicherungsstatus Detailinfos",
									),
									type: "textarea",
									placeholder: t(
										"institutionDraftWizardModal.form.information.protectionStatusInfo.placeholder",
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
								"institutionDraftWizardModal.form.information.accordions.space.title",
							),
							accordionDescription: t(
								"institutionDraftWizardModal.form.information.accordions.space.description",
							),
							defaultOpen: false,
							type: "section",
							cardVariant: "none",
							fields: [
								{
									name: "area",
									label: fieldLabel("usableAreaSize", "Nutzfläche in m²"),
									type: "number",
									placeholder: t(
										"institutionDraftWizardModal.form.information.space.areaPlaceholder",
									),
								},
								{
									name: "number_of_rooms",
									label: fieldLabel(
										"number_of_rooms",
										"Anzahl der Arbeitsräume",
									),
									type: "number",
									placeholder: t(
										"institutionDraftWizardModal.form.information.space.roomsPlaceholder",
									),
								},
								{
									name: "capacity",
									label: fieldLabel("capacity", "Kapazität"),
									type: "number",
									placeholder: t(
										"institutionDraftWizardModal.form.information.space.capacityPlaceholder",
									),
								},
							],
						},
						{
							name: "accessibility_accordion",
							collapsible: true,
							className: "border-t-1",
							accordionVariant: "default",
							accordionTitle: t(
								"institutionDraftWizardModal.form.information.accordions.accessibility.title",
							),
							accordionDescription:
								"Informationen zur Barrierefreiheit der Kultureinrichtung.",
							defaultOpen: false,
							type: "section",
							cardVariant: "none",
							fields: [
								{
									name: "accessibility",
									label: t(
										"institutionDraftWizardModal.form.information.accessibility.label",
									),
									type: "textarea",
									placeholder: t(
										"institutionDraftWizardModal.form.information.accessibility.placeholder",
									),
								},
							],
						},
						{
							name: "cost_accordion",
							collapsible: true,
							className: "border-t-1",
							accordionVariant: "default",
							accordionTitle: t(
								"institutionDraftWizardModal.form.information.accordions.cost.title",
							),
							accordionDescription:
								"Angaben zu Eintrittspreisen oder Nutzungskosten.",
							defaultOpen: false,
							type: "section",
							cardVariant: "none",
							fields: [
								{
									name: "cost",
									label: t(
										"institutionDraftWizardModal.form.information.cost.label",
									),
									type: "textarea",
									placeholder: t(
										"institutionDraftWizardModal.form.information.cost.placeholder",
									),
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
							name: "notes",
							label: fieldLabel("notes", "Notizen"),
							type: "textarea",
							placeholder: t(
								"institutionDraftWizardModal.form.information.notes.placeholder",
							),
						},
					],
				},
			],
			initialValues: draft,
			onChange: handleStepChange,
			onSubmit: handleStepSubmit,
			onCancel: handleCancel,
			cancelLabel: t("institutionDraftWizardModal.actions.back"),
			submitLabel: t("institutionDraftWizardModal.actions.next"),
			showCancel: true,
		}),
		[
			draft,
			handleCancel,
			handleStepChange,
			handleStepSubmit,
			fieldLabel,
			t,
			tEnum,
		],
	);

	const contactFormConfig: FormWrapperConfig = useMemo(
		() => ({
			formId: "institution-contact-form",
			fields: [
				{
					name: "consentSection",
					type: "section",
					title: t("institutionDraftWizardModal.form.contact.consent.title"),
					layout: { span: "full" },
					fields: [
						{
							name: "works_for_organization",
							label: t(
								"institutionDraftWizardModal.form.contact.consent.worksForOrganization",
							),
							type: "checkbox",
						},
						{
							name: "consent_contact_listing",
							label: t(
								"institutionDraftWizardModal.form.contact.consent.contactListing",
							),
							condition: (formData) => formData.works_for_organization === true,
							type: "checkbox",
						},
					],
				},
				{
					name: "contactSection",
					type: "section",
					layout: { span: "full", columns: 2 },
					condition: (formData) =>
						formData.works_for_organization === true &&
						formData.consent_contact_listing === true,
					fields: [
						{
							name: "contact_person_first_name",
							label: t(
								"institutionDraftWizardModal.form.contact.firstName.label",
							),
							type: "text",
							placeholder: t(
								"institutionDraftWizardModal.form.contact.firstName.placeholder",
							),
							layout: { span: "half" },
						},
						{
							name: "contact_person_last_name",
							label: t(
								"institutionDraftWizardModal.form.contact.lastName.label",
							),
							type: "text",
							placeholder: t(
								"institutionDraftWizardModal.form.contact.lastName.placeholder",
							),
							layout: { span: "half" },
						},
						{
							name: "contact_person_email",
							label: t("institutionDraftWizardModal.form.contact.email.label"),
							type: "email",
							placeholder: t(
								"institutionDraftWizardModal.form.contact.email.placeholder",
							),
							layout: { span: "full" },
						},
						{
							name: "contact_person_phone",
							label: t("institutionDraftWizardModal.form.contact.phone.label"),
							type: "text",
							placeholder: t(
								"institutionDraftWizardModal.form.contact.phone.placeholder",
							),
							layout: { span: "full" },
						},
					],
				},
			],
			initialValues: draft,
			onChange: handleStepChange,
			onSubmit: handleStepSubmit,
			onCancel: handleCancel,
			cancelLabel: t("institutionDraftWizardModal.actions.back"),
			submitLabel: t("institutionDraftWizardModal.actions.review"),
			showCancel: true,
		}),
		[draft, handleCancel, handleStepChange, handleStepSubmit, t],
	);

	const originalInstitution = useMemo(() => {
		const original = draft.originalInstitution as
			| Record<string, unknown>
			| undefined;
		return original && typeof original === "object" ? original : undefined;
	}, [draft]);

	const currentFormConfig = useMemo(() => {
		switch (currentStepId) {
			case "basic":
				return basicFormConfig;
			case "category":
				return categoryFormConfig;
			case "information":
				return informationFormConfig;
			case "contact":
				return contactFormConfig;
			default:
				return basicFormConfig;
		}
	}, [
		basicFormConfig,
		categoryFormConfig,
		informationFormConfig,
		contactFormConfig,
		currentStepId,
	]);

	const currentStepFieldsRef = useRef(currentFormConfig.fields);
	const resolvedStepHeader = useMemo(() => {
		const stepKey =
			currentStepId === "basic" ||
			currentStepId === "category" ||
			currentStepId === "information" ||
			currentStepId === "contact" ||
			currentStepId === "review"
				? currentStepId
				: "basic";
		return {
			title:
				t(`institutionDraftWizardModal.steps.${stepKey}.title`) || title || "",
			subtitle:
				t(`institutionDraftWizardModal.steps.${stepKey}.subtitle`) ||
				subtitle ||
				"",
		};
	}, [currentStepId, subtitle, t, title]);

	useEffect(() => {
		draftRef.current = draft;
	}, [draft]);

	useEffect(() => {
		currentStepFieldsRef.current = currentFormConfig.fields;
	}, [currentFormConfig.fields]);

	useEffect(() => {
		if (isUpdateReviewOnly || currentStepId === "review") return;
		setStepValidation(currentStepId, () => {
			const formData = draftRef.current;
			const validatableFields = getStepValidatableFields(
				currentStepFieldsRef.current,
				formData,
			);
			return validatableFields.every((field) =>
				validateStepFieldValue(field, formData[field.name], formData),
			);
		});
	}, [currentStepId, isUpdateReviewOnly, setStepValidation]);

	useEffect(() => {
		scrollStepContainerToTop();
	}, [currentStepId, scrollStepContainerToTop]);

	return (
		<div
			ref={wizardRootRef}
			className="Wizard-Root container mx-auto max-w-4xl py-10"
		>
			<div className="mb-8">
				<h1 className="text-3xl font-bold">{resolvedStepHeader.title}</h1>
				<p className="text-foreground mt-2">{resolvedStepHeader.subtitle}</p>
			</div>

			{!isUpdateReviewOnly && (
				<div className="mb-8 flex flex-col items-center space-y-2 mx-24">
					<StepIndicator />
					<span className="body2">
						{t("institutionDraftWizardModal.stepLabel", {
							current: currentStepIndex + 1,
							total: totalSteps,
						})}
					</span>
				</div>
			)}

			{currentStepId === "review" ? (
				<div className="space-y-4">
					<section className="w-full rounded-lg overflow-hidden">
						<InstitutionReview
							data={originalInstitution ?? draft}
							newData={originalInstitution ? draft : undefined}
							onEditSection={(sectionId) => {
								if (typeof window !== "undefined") {
									window.location.hash = sectionId;
								}
								setEditSectionId(sectionId);
								setEditModalOpen(true);
							}}
						/>
					</section>
					<div className="flex items-center justify-end">
						<Button
							id="institution-draft-submit-button"
							onClick={() => void handleFinalSubmit(draft)}
						>
							{t("institutionDraftWizardModal.actions.submit")}
						</Button>
					</div>
				</div>
			) : (
				<FormWrapper key={currentStepId} config={currentFormConfig} />
			)}
			{editModalOpen ? (
				<InstitutionFormModal
					mode={draftMode === "update" ? "edit" : "create"}
					permissionContext="submission"
					initialValues={draft}
					onClose={closeSectionEditModal}
					onSubmit={({ data }) => {
						handleSectionEditSubmit(data as Record<string, unknown>);
					}}
					formKey={`draft-edit-${editSectionId ?? "default"}`}
					closeOnSubmit
					submitLabel={t("institutionFormModal.actions.save")}
				/>
			) : null}
		</div>
	);
}

export function InstitutionDraftWizardModal({
	initialStepId,
	routePath,
}: {
	initialStepId?: string;
	routePath?: string;
}) {
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const { t } = useTranslation("content");
	const closeModal = useRoutedModalClose({});
	const resetDraft = useInstitutionDraftStore((state) => state.resetDraft);
	const storedStepId = useInstitutionDraftStore((state) => state.stepId);
	const setStepId = useInstitutionDraftStore((state) => state.setStepId);
	const draftMode = useInstitutionDraftStore((state) => state.mode);
	const isUpdateReviewOnly = draftMode === "update";
	const reviewOnlySteps = useMemo(
		() => stepConfigs.filter((step) => step.id === "review"),
		[],
	);
	const resolvedSteps = isUpdateReviewOnly ? reviewOnlySteps : stepConfigs;
	const isValidStep = stepConfigs.some((step) => step.id === initialStepId);
	const resolvedStepId = isValidStep ? initialStepId : storedStepId;
	const handleSubmitted = useCallback(() => {
		const targetPath = toLocalePath("/institution?thankyou=1");
		router.replace(targetPath);
		if (typeof window !== "undefined") {
			window.setTimeout(() => {
				const stuckOnSubmission = window.location.pathname.includes(
					"/institution/submission",
				);
				if (stuckOnSubmission) {
					window.location.replace(targetPath);
				}
			}, 200);
		}
		showSuccessToast(
			t("institutionDraftWizardModal.feedback.submit.title", {
				defaultValue: "Submission sent",
			}),
			t("institutionDraftWizardModal.feedback.submit.description", {
				defaultValue: "Your submission has been sent for review.",
			}),
		);
		queueMicrotask(() => {
			resetDraft();
		});
	}, [resetDraft, router, t, toLocalePath]);

	useEffect(() => {
		if (isUpdateReviewOnly) {
			setStepId("review");
			return;
		}
		if (initialStepId && isValidStep) {
			setStepId(initialStepId);
			return;
		}
		setStepId(DEFAULT_CREATE_STEP_ID);
	}, [initialStepId, isUpdateReviewOnly, isValidStep, setStepId]);

	return (
		<Modal
			title={t("institutionDraftWizardModal.dialog.create.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			closeConfirmation={{
				title: t("institutionModalCloseConfirmation.title"),
				description: t("institutionModalCloseConfirmation.description"),
				confirmLabel: t("institutionModalCloseConfirmation.confirm"),
				cancelLabel: t("institutionModalCloseConfirmation.cancel"),
			}}
			containerClassName="p-0 md:p-0 mt-0 md:mt-0"
			contentWrapperClassName="flex-1"
			contentClassName=""
		>
			<div className="flex min-h-full flex-col bg-background py-10 space-y-10">
				<HorizontalStepper
					steps={resolvedSteps}
					initialStepId={isUpdateReviewOnly ? "review" : resolvedStepId}
				>
					<InstitutionDraftWizardContent
						title={t("institutionDraftWizardModal.dialog.create.title")}
						subtitle={t("institutionDraftWizardModal.dialog.create.subtitle")}
						onSubmitted={handleSubmitted}
						onCloseRequest={closeModal}
					/>
				</HorizontalStepper>
			</div>
		</Modal>
	);
}
