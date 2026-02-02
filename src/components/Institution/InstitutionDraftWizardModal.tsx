"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import {
	HorizontalStepper,
	StepIndicator,
	useHorizontalStepper,
	type StepConfig,
} from "@/components/HorizontalStepper";
import { Modal } from "@/components/Modals/Modal";
import { useTranslation } from "react-i18next";
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
import { SubmissionEntityType, SubmissionType } from "@/generated/prisma";
import { resolveCategoryIdsFromDraft } from "@/lib/utils/institutionCategoryUtils";
import { Button } from "@/components/ui/button";

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

type InstitutionDraftWizardContentProps = {
	title: string;
	subtitle: string;
};

function InstitutionDraftWizardContent({
	title,
	subtitle,
}: InstitutionDraftWizardContentProps) {
	const { t } = useTranslation("content");
	const { t: tEnum } = useTranslation("enumMap");

	const fieldLabel = useCallback(
		(key: string, fallback: string) => {
			const translated = tEnum(`field_names.${key}`);
			return translated === `field_names.${key}` ? fallback : translated;
		},
		[tEnum],
	);

	const categories = useInstitutionStore((state) => state.categories) ?? [];
	const draft = useInstitutionDraftStore((state) => state.draft);
	const setDraft = useInstitutionDraftStore((state) => state.setDraft);
	const setStepId = useInstitutionDraftStore((state) => state.setStepId);
	const resetDraft = useInstitutionDraftStore((state) => state.resetDraft);
	const draftMode = useInstitutionDraftStore((state) => state.mode);
	const [editSectionId, setEditSectionId] = useState<string | null>(null);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const hasOpenedFromHash = useRef(false);

	const router = useRouter();
	const {
		currentStepId,
		currentStepIndex,
		totalSteps,
		goToStep,
		nextStep,
		previousStep,
		canGoNext,
		canGoPrevious,
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

	const handleStepChange = useCallback(
		(data: Record<string, unknown>) => {
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
			const { entityId, ...rest } = data as {
				entityId?: unknown;
			};
			const resolvedEntityId =
				typeof entityId === "number" && Number.isFinite(entityId)
					? entityId
					: null;
			if (draftMode === "update" && !resolvedEntityId) {
				throw new Error("Missing institution for update submission.");
			}
			const payload = {
				...rest,
				address: buildAddressFromFormData(data),
				categoryIds,
			};
			await createSubmission({
				entityType: SubmissionEntityType.institution,
				entityId: draftMode === "update" ? resolvedEntityId : null,
				type:
					draftMode === "update"
						? SubmissionType.update
						: SubmissionType.create,
				status: "approval_pending",
				data: payload,
			});
			resetDraft();
			router.push(
				draftMode === "update" ? "/institution" : "/account/institutions",
			);
		},
		[categories, draftMode, resetDraft, router],
	);

	const handleStepSubmit = useCallback(
		(data: Record<string, unknown>) => {
			const nextData = { ...draft, ...data };
			const address = buildAddressFromFormData(nextData);
			setDraft({ ...data, address });

			if (canGoNext) {
				nextStep();
			} else {
				void handleFinalSubmit({ ...nextData, address });
			}
		},
		[canGoNext, draft, handleFinalSubmit, nextStep, setDraft],
	);

	const handleCancel = useCallback(() => {
		if (canGoPrevious) {
			previousStep();
			return;
		}
		router.push("/account/institutions");
	}, [canGoPrevious, previousStep, router]);

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
					title: "Basic Information",
					layout: { columns: 2 },
					fields: [
						{
							name: "name",
							label: "Institution Name",
							type: "text",
							layout: { span: "full" },
							placeholder: "e.g., Staatliche Kunsthalle",
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
							layout: { span: "half" },
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
					name: "basicDetailsSection",
					type: "section",
					layout: { span: "full" },
					fields: [
						{
							name: "utilization_status",
							label: fieldLabel("utilization_status", "Utilization Status"),
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
							name: "parent_organization",
							label: fieldLabel("parent_organization", "Parent Organization"),
							type: "text",
							placeholder: t(
								"institutionFormModal.form.details.fields.parent_organization.placeholder",
							),
						},
						{
							name: "email",
							label: fieldLabel("email", "Email"),
							type: "email",
							placeholder: t(
								"institutionFormModal.form.details.fields.email.placeholder",
							),
						},
						{
							name: "phone",
							label: fieldLabel("phone", "Phone"),
							type: "text",
							placeholder: t(
								"institutionFormModal.form.details.fields.phone.placeholder",
							),
						},
						{
							name: "website",
							label: fieldLabel("website", "Website"),
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
			submitLabel: "Next",
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
					layout: { span: "full" },
					fields: [
						{
							name: "categoryFilters",
							type: "filterPanel",
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
							label: "Add New Category",
							className: "mt-4",
							type: "text",
							placeholder: "e.g., New Category",
							layout: { span: "full" },
						},
					],
				},
			],
			initialValues: draft,
			onChange: handleStepChange,
			onSubmit: handleStepSubmit,
			onCancel: handleCancel,
			cancelLabel: "Back",
			submitLabel: "Next",
			showCancel: true,
			layout: { columns: 2 },
		}),
		[categories, draft, handleCancel, handleStepChange, handleStepSubmit, t],
	);

	const contactFormConfig: FormWrapperConfig = useMemo(
		() => ({
			formId: "institution-shared-use-form",
			fields: [
				{
					name: "shared_use_section",
					type: "section",
					fields: [
						{
							name: "shared_use",
							label: "shared Use",
							type: "radio",
							radioVariant: "button",
							options: [
								{ value: "yes", label: "Ja" },
								{ value: "no", label: "Nein" },
							],
						},
						{
							name: "shared_use_details",
							label: "Details",
							cardVariant: "none",
							fieldGap: "gap-0",
							type: "section",
							fields: [
								{
									name: "shared_use_info",
									collapsible: true,
									accordionVariant: "default",
									accordionTitle: "Beschreibung der Räume/Flächen",
									accordionDescription:
										"Provide more details about the shared use arrangements.",
									defaultOpen: false,
									type: "textarea",
									placeholder: "e.g., Describe the shared use arrangements",
								},
								{
									name: "shared_use_equipment",
									className: "border-t-1",
									collapsible: true,
									accordionVariant: "default",
									accordionTitle: "Ausstattung",
									accordionDescription:
										"Provide more details about the shared use equipment.",
									defaultOpen: false,
									type: "textarea",
									placeholder: "e.g., Describe the shared use equipment",
								},
								{
									name: "shared_use_audience",
									className: "border-t-1",
									collapsible: true,
									accordionVariant: "default",
									accordionTitle: "Zielgruppe/Sparte",
									accordionDescription:
										"Provide more details about the shared use audience.",
									defaultOpen: false,
									type: "textarea",
									placeholder: "e.g., Describe the shared use audience",
								},
								{
									name: "shared_use_availability",
									className: "border-t-1",
									collapsible: true,
									accordionVariant: "default",
									accordionTitle: "Zetiliche Verfügbarkeiten",
									accordionDescription:
										"Provide more details about the shared use availability.",
									defaultOpen: false,
									type: "textarea",
									placeholder: "e.g., Describe the shared use availability",
								},
								{
									name: "shared_use_accessibility",
									className: "border-t-1",
									collapsible: true,
									accordionVariant: "default",
									accordionTitle: "Barrierefreiheit",
									accordionDescription:
										"Provide more details about the shared use accessibility.",
									defaultOpen: false,
									type: "textarea",
									placeholder: "e.g., Describe the shared use accessibility",
								},
								{
									name: "shared_use_contact_person",
									className: "border-t-1",
									collapsible: true,
									accordionVariant: "default",
									accordionTitle: "Kontaktperson",
									accordionDescription:
										"Provide contact information about the shared use contact person.",
									defaultOpen: false,
									type: "text",
									placeholder: "e.g., Describe the shared use contact person.",
								},
							],
						},
					],
				},
				{
					name: "organization_section",
					type: "section",
					fields: [
						{
							name: "organization",
							collapsible: true,
							accordionVariant: "default",
							accordionTitle: "Organisationsform",
							accordionDescription:
								"Provide more details about the organization.",
							defaultOpen: false,
							type: "text",
							placeholder: "e.g., Describe the organization",
						},
						{
							name: "organization_type",
							collapsible: true,
							accordionVariant: "default",
							accordionTitle: "Organisationsform",
							accordionDescription:
								"Provide more details about the organization.",
							defaultOpen: false,
							type: "section",
							cardVariant: "none",
							fields: [
								{
									name: "organization_type_info",
									type: "radio",
									radioVariant: "button",
									options: [
										{ value: "public", label: "Public" },
										{ value: "private", label: "Private" },
										{ value: "non_profit", label: "Non-Profit" },
										{ value: "other", label: "Other" },
									],
									placeholder: "e.g., Describe the organization type",
								},
								{
									name: "organization_type_info",
									type: "text",
									placeholder: "e.g., Describe the organization type",
								},
							],
						},
					],
				},
			],
			initialValues: draft,
			onChange: handleStepChange,
			onSubmit: handleStepSubmit,
			onCancel: handleCancel,
			cancelLabel: "Back",
			submitLabel: "Next",
			showCancel: true,
		}),
		[draft, handleCancel, handleStepChange, handleStepSubmit],
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
			case "contact":
				return contactFormConfig;
			default:
				return basicFormConfig;
		}
	}, [basicFormConfig, categoryFormConfig, contactFormConfig, currentStepId]);

	return (
		<div className="container mx-auto max-w-4xl py-10">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">{title}</h1>
				<p className="text-foreground mt-2">{subtitle}</p>
			</div>

			<div className="mb-8 flex flex-col items-center space-y-2 mx-24">
				<StepIndicator />
				<span className="body2">
					Schritt {currentStepIndex + 1} / {totalSteps}
				</span>
			</div>

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
						<Button onClick={() => void handleFinalSubmit(draft)}>
							Submission senden
						</Button>
					</div>
				</div>
			) : (
				<FormWrapper key={currentStepId} config={currentFormConfig} />
			)}
			{editModalOpen ? (
				<InstitutionFormModal
					mode={draftMode === "update" ? "edit" : "create"}
					initialValues={draft}
					onClose={() => {
						if (typeof window !== "undefined") {
							const { pathname, search } = window.location;
							window.history.replaceState(null, "", `${pathname}${search}`);
						}
						setEditModalOpen(false);
					}}
					onSubmit={({ data }) => {
						const address = buildAddressFromFormData(data);
						setDraft({ ...data, address });
						if (typeof window !== "undefined") {
							const { pathname, search } = window.location;
							window.history.replaceState(null, "", `${pathname}${search}`);
						}
						setEditModalOpen(false);
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
}: {
	initialStepId?: string;
}) {
	const storedStepId = useInstitutionDraftStore((state) => state.stepId);
	const setStepId = useInstitutionDraftStore((state) => state.setStepId);
	const isValidStep = stepConfigs.some((step) => step.id === initialStepId);
	const resolvedStepId = isValidStep ? initialStepId : storedStepId;

	useEffect(() => {
		if (initialStepId && isValidStep) {
			setStepId(initialStepId);
		}
	}, [initialStepId, isValidStep, setStepId]);

	return (
		<Modal
			title="Add New Institution"
			titleClassName="sr-only"
			variant="fullscreen"
			containerClassName="p-0 md:p-0 mt-0 md:mt-0"
			contentWrapperClassName="flex-1"
			contentClassName=""
			content={
				<div className="flex min-h-full flex-col bg-background py-10 space-y-10">
					<HorizontalStepper steps={stepConfigs} initialStepId={resolvedStepId}>
						<InstitutionDraftWizardContent
							title="Add New Institution"
							subtitle="Complete the following steps to add a new cultural institution"
						/>
					</HorizontalStepper>
				</div>
			}
		/>
	);
}

export function InstitutionDraftWizardEditModal() {
	return (
		<Modal
			title="Edit Institution"
			titleClassName="sr-only"
			variant="fullscreen"
			containerClassName="p-0 md:p-0 mt-0 md:mt-0"
			contentWrapperClassName="flex-1"
			contentClassName=""
			content={
				<div className="flex min-h-full flex-col bg-background py-10 space-y-10">
					<HorizontalStepper steps={stepConfigs}>
						<InstitutionDraftWizardContent
							title="Edit Institution"
							subtitle="Review and update the institution details"
						/>
					</HorizontalStepper>
				</div>
			}
		/>
	);
}
