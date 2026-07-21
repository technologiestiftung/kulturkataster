"use client";

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { FormWrapper } from "@/components/FormWrapper";
import type { FieldConfig, FormWrapperConfig } from "@/components/FormWrapper";
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
import {
	getFieldDescription,
	getFieldPlaceholder,
	getFieldLabel,
} from "@/lib/i18n/fieldLabels";
import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";
import { geocodeAddress, reverseGeocode } from "@/server/actions/maptiler";
import {
	buildAddressFromFormData,
	handleAddressBlur,
} from "@/lib/utils/formUtils";
import { useAccountStore } from "@/lib/store/accountStore";
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
import { buildInstitutionForFormFromDraft } from "@/lib/utils/institutionFormAdapter";
import {
	findPotentialInstitutionDuplicates,
	hasDuplicateInstitutionByNameAndAddress,
} from "@/lib/utils/institutionDuplicateUtils";
import { useInstitutionPrivateFieldResolver } from "@/lib/hooks/useInstitutionPrivateFieldResolver";
import { Profile } from "@/types";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";
import { buildCategoryGroups } from "@/lib/utils/categoryUtils";
const DEFAULT_CREATE_STEP_ID = "basic";
const STEP_IDS = [
	"basic",
	"category",
	"information",
	"contact",
	"review",
] as const;

const CONTACT_PERSON_FIELDS = [
	"contact_person_first_name",
	"contact_person_last_name",
	"contact_person_email",
	"contact_person_phone",
] as const;

const removeUnconsentedContactPersonFields = (
	data: Record<string, unknown>,
) => {
	if (data.consent_contact_listing === true) return data;
	const sanitized = { ...data };
	for (const field of CONTACT_PERSON_FIELDS) {
		delete sanitized[field];
	}
	return sanitized;
};

const filterContactPersonFieldsByConsent = (
	data: Record<string, unknown>,
	canShareContactPerson: boolean,
) => {
	if (canShareContactPerson) return data;
	const sanitized = { ...data };
	for (const field of CONTACT_PERSON_FIELDS) {
		delete sanitized[field];
	}
	return sanitized;
};

const getContactPersonClearPatch = () =>
	Object.fromEntries(
		CONTACT_PERSON_FIELDS.map((field) => [field, undefined]),
	) as Record<string, undefined>;

const canKeepContactPersonFields = (
	draftMode: "create" | "update",
	data: Record<string, unknown>,
) => draftMode === "update" || data.consent_contact_listing === true;

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

	if (
		field.type !== "section" &&
		field.validators?.some((validator) => validator(value, formData))
	) {
		return false;
	}

	return true;
};

type InstitutionDraftWizardContentProps = {
	title?: string;
	subtitle?: string;
	profile: Profile | null;
	onSubmitted?: () => void;
	onCloseRequest?: () => void;
	onSubmitError?: (message: string) => void;
};

function InstitutionDraftWizardContent({
	title,
	subtitle,
	profile,
	onSubmitted,
	onCloseRequest,
	onSubmitError,
}: InstitutionDraftWizardContentProps) {
	const { t, i18n } = useTranslation();
	const { t: tEnum } = useTranslation();
	const { isPrivateField } = useInstitutionPrivateFieldResolver();

	const fieldLabel = useCallback(
		(key: string, _fallback?: string) => getFieldLabel(tEnum, key),
		[tEnum],
	);
	const fieldDescription = useCallback(
		(key: string) => getFieldDescription(tEnum, key),
		[tEnum],
	);
	const fieldPlaceholder = useCallback(
		(key: string) => getFieldPlaceholder(tEnum, key),
		[tEnum],
	);

	const accountCategories = useAccountStore((state) => state.categories);
	const institutionCategories = useInstitutionStore(
		(state) => state.categories,
	);
	const institutionList = useInstitutionStore((state) => state.allInstitutions);
	const categoryGroups = useMemo(
		() =>
			institutionCategories?.length
				? institutionCategories
				: buildCategoryGroups(accountCategories),
		[institutionCategories, accountCategories],
	);
	const allInstitutions = institutionList ?? [];
	const draft = useInstitutionDraftStore((state) => state.draft);
	const setDraft = useInstitutionDraftStore((state) => state.setDraft);
	const setStepId = useInstitutionDraftStore((state) => state.setStepId);
	const draftMode = useInstitutionDraftStore((state) => state.mode);
	const contactProfile = draftMode === "create" ? profile : null;
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

	const onAddressBlur = handleAddressBlur(addressGeocodeState, geocodeAddress, {
		reverseGeocode,
		districtKey: "address.district",
		neighbourhoodKey: "address.neighbourhood",
	});

	const duplicateInstitutionMessage = t(
		"content.institutionFormModal.form.details.validation.duplicateInstitution",
		{
			defaultValue: "An institution with this name and address already exists.",
		},
	);

	const activeInstitutionId = useMemo(() => {
		const directId =
			typeof draft.entityId === "number" && Number.isFinite(draft.entityId)
				? draft.entityId
				: null;
		if (directId !== null) return directId;
		const originalInstitution =
			draft.originalInstitution &&
			typeof draft.originalInstitution === "object" &&
			typeof (draft.originalInstitution as { id?: unknown }).id === "number"
				? ((draft.originalInstitution as { id: number }).id ?? null)
				: null;
		return originalInstitution;
	}, [draft.entityId, draft.originalInstitution]);

	const validateDuplicateInstitution = useCallback(
		(formData: Record<string, unknown>) => {
			const hasDuplicate = hasDuplicateInstitutionByNameAndAddress({
				formData,
				institutions: allInstitutions,
				currentInstitutionId: activeInstitutionId,
			});
			return hasDuplicate ? duplicateInstitutionMessage : undefined;
		},
		[activeInstitutionId, allInstitutions, duplicateInstitutionMessage],
	);
	const potentialDuplicates = useMemo(() => {
		const hasHardDuplicate = hasDuplicateInstitutionByNameAndAddress({
			formData: draft,
			institutions: allInstitutions,
			currentInstitutionId: activeInstitutionId,
		});
		if (hasHardDuplicate) return [];
		return findPotentialInstitutionDuplicates({
			formData: draft,
			institutions: allInstitutions,
			currentInstitutionId: activeInstitutionId,
			maxResults: 3,
		});
	}, [activeInstitutionId, allInstitutions, draft]);
	const localePrefix = i18n?.resolvedLanguage === "en" ? "en" : "de";
	const duplicateWarningText = useMemo<ReactNode>(() => {
		if (potentialDuplicates.length === 0) return null;
		const warningText = t(
			"content.institutionFormModal.form.details.validation.duplicatePossible",
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
	const isPrivateFormField = useCallback(
		(field: FieldConfig) => {
			if (field.type === "section" || field.type === "actionPanel")
				return false;
			return isPrivateField(field);
		},
		[isPrivateField],
	);
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
			const canShareContactPerson = canKeepContactPersonFields(
				draftMode,
				nextDraft,
			);
			const sanitizedNextDraft =
				removeUnconsentedContactPersonFields(nextDraft);
			const sanitizedData = filterContactPersonFieldsByConsent(
				data,
				canShareContactPerson,
			);
			draftRef.current = sanitizedNextDraft;
			setDraft({
				...sanitizedData,
				...(canShareContactPerson ? {} : getContactPersonClearPatch()),
			});
		},
		[draftMode, setDraft],
	);

	const handleFinalSubmit = useCallback(
		async (data: Record<string, unknown>) => {
			const categoryIds = resolveCategoryIdsFromDraft(
				data as Record<string, unknown>,
				categoryGroups,
			);
			const { entityId, newCategory, ...rest } = data as {
				entityId?: unknown;
				newCategory?: unknown;
			};
			const resolvedEntityId =
				typeof entityId === "number" && Number.isFinite(entityId)
					? entityId
					: null;
			const canShareContactPerson = canKeepContactPersonFields(draftMode, data);
			if (draftMode === "update" && !resolvedEntityId) {
				throw new Error("Missing institution for update submission.");
			}
			const sanitizedRest = canShareContactPerson
				? ({ ...rest } as Record<string, unknown>)
				: removeUnconsentedContactPersonFields(rest as Record<string, unknown>);
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
			if (proposedCategories.length > 0) {
				await Promise.allSettled(
					proposedCategories.map((key) =>
						createSubmission({
							entityType: SubmissionEntityType.category,
							entityId: null,
							type: SubmissionType.create,
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
			onSubmitted?.();
		},
		[categoryGroups, draftMode, onSubmitted],
	);

	const handleStepSubmit = useCallback(
		(data: Record<string, unknown>) => {
			const nextData = { ...draft, ...data };
			const address = buildAddressFromFormData(nextData);
			const canShareContactPerson = canKeepContactPersonFields(
				draftMode,
				nextData,
			);
			const sanitizedData = filterContactPersonFieldsByConsent(
				data,
				canShareContactPerson,
			);
			const sanitizedNextData = removeUnconsentedContactPersonFields(nextData);
			draftRef.current = { ...sanitizedNextData, address };
			setDraft({
				...sanitizedData,
				...(canShareContactPerson ? {} : getContactPersonClearPatch()),
				address,
			});
			nextStep();
		},
		[draft, nextStep, setDraft],
	);

	const handleReviewSubmit = useCallback(async () => {
		try {
			await handleFinalSubmit(draft);
		} catch (error) {
			reportClientTelemetry({
				level: "error",
				event: "institution_draft.submit_failed",
				error,
				metadata: {
					step_id: currentStepId,
					draft_mode: draftMode,
					error_digest:
						error instanceof Error &&
						typeof (error as Error & { digest?: unknown }).digest === "string"
							? (error as Error & { digest: string }).digest
							: undefined,
				},
			});
			const message =
				error instanceof Error
					? error.message
					: t("content.institutionFormModal.review.errorUnknown", {
							defaultValue: "Unknown error.",
						});
			onSubmitError?.(
				typeof message === "string" && message.includes("pending")
					? t(
							"content.institutionDraftWizardModal.feedback.submit.pendingConflict",
						)
					: message,
			);
		}
	}, [currentStepId, draft, draftMode, handleFinalSubmit, onSubmitError, t]);

	const handleCancel = useCallback(() => {
		if (canGoPrevious) {
			previousStep();
			return;
		}
		onCloseRequest?.();
	}, [canGoPrevious, onCloseRequest, previousStep]);

	const setSectionHash = useCallback((sectionId: string) => {
		if (typeof window === "undefined") return;
		const { pathname, search } = window.location;
		const hash = sectionId.trim();
		const nextUrl = hash
			? `${pathname}${search}#${hash}`
			: `${pathname}${search}`;
		window.history.replaceState(null, "", nextUrl);
	}, []);

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
			const nextData = { ...draftRef.current, ...data };
			const address = buildAddressFromFormData(data);
			const canShareContactPerson = canKeepContactPersonFields(
				draftMode,
				nextData,
			);
			const sanitizedData = filterContactPersonFieldsByConsent(
				data,
				canShareContactPerson,
			);
			const sanitizedNextData = removeUnconsentedContactPersonFields(nextData);
			draftRef.current = { ...sanitizedNextData, address };
			setDraft({
				...sanitizedData,
				...(canShareContactPerson ? {} : getContactPersonClearPatch()),
				address,
			});
			closeSectionEditModal();
		},
		[closeSectionEditModal, draftMode, setDraft],
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
					title: t("content.institutionFormModal.form.basic.sectionTitle"),
					layout: { columns: 2 },
					fields: [
						{
							name: "name",
							label: fieldLabel("name"),
							type: "text",
							layout: { span: "full" },
							placeholder: fieldPlaceholder("name"),
							required: true,
							validators: [
								(_value, formData) => validateDuplicateInstitution(formData),
							],

							afterField: duplicateWarningText,
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
							name: "address.lng",
							fieldMetaKey: "lng",
							label: fieldLabel("lng", "Längengrad"),
							type: "number",
							layout: { span: "half" },
						},
						{
							name: "address.lat",
							fieldMetaKey: "lat",
							label: fieldLabel("lat", "Breitengrad"),
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
							layout: { span: "full" },
							placeholder: fieldPlaceholder("street"),
							onBlur: onAddressBlur,
							validators: [
								(_value, formData) => validateDuplicateInstitution(formData),
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
					name: "basicDetailsSection",
					type: "section",
					layout: { span: "full" },
					fields: [
						{
							name: "utilization_status",
							label: fieldLabel("utilization_status", "Utilization Status"),
							description: fieldDescription("utilization_status"),
							type: "select",
							allowNullOption: true,
							nullOptionLabel: tEnum(
								"enumMap.field_names.utilization_status.options.none",
							),
							placeholder: fieldPlaceholder("utilization_status"),
							options: [
								{
									value: "in_use",
									label: tEnum(
										"enumMap.field_names.utilization_status.options.in_use",
									),
								},
								{
									value: "permanently_closed",
									label: tEnum(
										"enumMap.field_names.utilization_status.options.permanently_closed",
									),
								},
								{
									value: "planned_use",
									label: tEnum(
										"enumMap.field_names.utilization_status.options.planned_use",
									),
								},
								{
									value: "potential_space",
									label: tEnum(
										"enumMap.field_names.utilization_status.options.potential_space",
									),
								},
								{
									value: "temporarily_closed",
									label: tEnum(
										"enumMap.field_names.utilization_status.options.temporarily_closed",
									),
								},
								{
									value: "unknown",
									label: tEnum(
										"enumMap.field_names.utilization_status.options.unknown",
									),
								},
							],
						},
						{
							name: "parent_organization",
							label: fieldLabel("parent_organization", "Parent Organization"),
							description: fieldDescription("parent_organization"),
							type: "text",
							placeholder: fieldPlaceholder("parent_organization"),
						},
						{
							name: "email",
							label: fieldLabel("email", "Email"),
							description: fieldDescription("email"),
							type: "email",
							placeholder: fieldPlaceholder("email"),
						},
						{
							name: "phone",
							label: fieldLabel("phone", "Phone"),
							description: fieldDescription("phone"),
							type: "tel",
							placeholder: fieldPlaceholder("phone"),
						},
						{
							name: "website",
							label: fieldLabel("website", "Website"),
							type: "url",
							placeholder: fieldPlaceholder("website"),
						},
					],
				},
			],

			initialValues: draft,
			onChange: handleStepChange,
			onSubmit: handleStepSubmit,
			onCancel: handleCancel,
			cancelLabel: t("common.cancel"),
			submitLabel: t("content.institutionDraftWizardModal.actions.next"),
			showCancel: true,
			isPrivateField: isPrivateFormField,
		}),
		[
			draft,
			handleCancel,
			handleStepChange,
			handleStepSubmit,
			isPrivateFormField,
			onAddressBlur,
			validateDuplicateInstitution,
			potentialDuplicates,
			localePrefix,
			duplicateWarningText,
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
							fieldMetaKey: "categories",
							label: fieldLabel("categories"),
							type: "filterPanel",
							required: true,
							validators: [
								(value, formData) => {
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
										: t(
												"content.institutionFormModal.form.category.validation.minSelection",
											);
								},
							],

							layout: { span: "full" },
							filterPanel: {
								categoryGroups,
								districts: [],
								categorySectionMode: "selection",
								parentCategorySelectionBehavior: "last-child-only",
								showSummary: false,
								showDistricts: false,
								showClosedToggle: false,
								selectionEmptyLabel: fieldPlaceholder("categories"),
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
								"content.institutionFormModal.form.category.newCategory.label",
							),
							description: t(
								"content.institutionFormModal.form.category.newCategory.description",
							),
							className: "mt-4",
							type: "text",
							placeholder: t(
								"content.institutionFormModal.form.category.newCategory.placeholder",
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
			cancelLabel: t("content.institutionDraftWizardModal.actions.back"),
			submitLabel: t("content.institutionDraftWizardModal.actions.next"),
			showCancel: true,
			layout: { columns: 2 },
			isPrivateField: isPrivateFormField,
		}),
		[
			categoryGroups,
			draft,
			handleCancel,
			handleStepChange,
			handleStepSubmit,
			isPrivateFormField,
			t,
		],
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
							name: "shared_use_allowed",
							label: fieldLabel("shared_use_allowed"),
							type: "radio",
							radioVariant: "button",
							allowNullOption: true,
							nullOptionLabel: tEnum(
								"enumMap.field_names.shared_use_allowed.options.none",
							),
							options: [
								{
									value: true,
									label: tEnum(
										"enumMap.field_names.shared_use_allowed.options.yes",
									),
								},
								{
									value: false,
									label: tEnum(
										"enumMap.field_names.shared_use_allowed.options.no",
									),
								},
							],
						},
						{
							name: "shared_use_details",
							label: t(
								"content.institutionFormModal.form.information.sharedUse.detailsLabel",
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
										"content.institutionFormModal.form.information.accordions.sharedUseInfo.title",
									),
									accordionDescription: t(
										"content.institutionFormModal.form.information.accordions.sharedUseInfo.description",
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
										"content.institutionFormModal.form.information.accordions.sharedUseEquipment.title",
									),
									accordionDescription: t(
										"content.institutionFormModal.form.information.accordions.sharedUseEquipment.description",
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
										"content.institutionFormModal.form.information.accordions.sharedUseAudience.title",
									),
									accordionDescription: t(
										"content.institutionFormModal.form.information.accordions.sharedUseAudience.description",
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
										"content.institutionFormModal.form.information.accordions.sharedUseAvailability.title",
									),
									accordionDescription: t(
										"content.institutionFormModal.form.information.accordions.sharedUseAvailability.description",
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
										"content.institutionFormModal.form.information.accordions.sharedUseAccessibility.title",
									),
									accordionDescription: t(
										"content.institutionFormModal.form.information.accordions.sharedUseAccessibility.description",
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
										"content.institutionFormModal.form.information.accordions.sharedUseCost.title",
									),
									accordionDescription: t(
										"content.institutionFormModal.form.information.accordions.sharedUseCost.description",
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
										"content.institutionFormModal.form.information.accordions.sharedUseContactPerson.title",
									),
									accordionDescription: t(
										"content.institutionFormModal.form.information.accordions.sharedUseContactPerson.description",
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
					title: t("content.institutionFormModal.form.organization.title"),
					fieldGap: "gap-0",
					fields: [
						{
							name: "organization_type",
							collapsible: true,
							accordionVariant: "default",
							accordionTitle: t(
								"content.institutionFormModal.form.information.accordions.organization.title",
							),
							accordionDescription: t(
								"content.institutionFormModal.form.information.accordions.organization.description",
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
								"content.institutionFormModal.form.information.accordions.funding.title",
							),
							accordionDescription: t(
								"content.institutionFormModal.form.information.accordions.funding.description",
							),
							defaultOpen: false,
							type: "section",
							cardVariant: "none",
							fields: [
								{
									name: "funding_type",
									allowNullOption: true,
									nullOptionLabel: tEnum(
										"enumMap.field_names.funding_type.options.none",
									),
									label: fieldLabel("funding_type", "Funding Type"),
									type: "select",
									options: [
										{
											value: "workspace_program",
											label: tEnum(
												"enumMap.field_names.funding_type.options.workspace_program",
											),
										},
										{
											value: "institutional_funding",
											label: tEnum(
												"enumMap.field_names.funding_type.options.institutional_funding",
											),
										},
										{
											value: "temporary_project_funding",
											label: tEnum(
												"enumMap.field_names.funding_type.options.temporary_project_funding",
											),
										},
										{
											value: "no_funding",
											label: tEnum(
												"enumMap.field_names.funding_type.options.no_funding",
											),
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
								"content.institutionFormModal.form.information.accordions.fundingSources.title",
							),
							accordionDescription: t(
								"content.institutionFormModal.form.information.accordions.fundingSources.description",
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
										"enumMap.field_names.funding_source.options.none",
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
											"enumMap.field_names.funding_sources.actions.add",
										),
										removeButtonLabel: tEnum(
											"enumMap.field_names.funding_sources.actions.remove",
										),
									},
								},
							],
						},
					],
				},
				{
					name: "details_section",
					title: t("content.institutionFormModal.form.details.title"),
					type: "section",
					fieldGap: "gap-0",
					fields: [
						{
							name: "establishment_accordion",
							collapsible: true,
							className: "border-t-1",
							accordionVariant: "default",
							accordionTitle: t(
								"content.institutionFormModal.form.information.accordions.establishment.title",
							),
							accordionDescription: t(
								"content.institutionFormModal.form.information.accordions.establishment.description",
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
								"content.institutionFormModal.form.information.accordions.closing.title",
							),
							accordionDescription: t(
								"content.institutionFormModal.form.information.accordions.closing.description",
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
								"content.institutionFormModal.form.information.accordions.ownership.title",
							),
							accordionDescription: t(
								"content.institutionFormModal.form.information.accordions.ownership.description",
							),
							defaultOpen: false,
							type: "section",
							cardVariant: "none",
							fields: [
								{
									name: "owner_type",
									label: fieldLabel("owner_type", "Eigentümer*innenart"),
									type: "select",
									allowNullOption: true,
									nullOptionLabel: tEnum(
										"enumMap.field_names.owner_type.options.none",
									),
									options: [
										{
											value: "private",
											label: tEnum(
												"enumMap.field_names.owner_type.options.private",
											),
										},
										{
											value: "federal_property",
											label: tEnum(
												"enumMap.field_names.owner_type.options.federal_property",
											),
										},
										{
											value: "state_property",
											label: tEnum(
												"enumMap.field_names.owner_type.options.state_property",
											),
										},
										{
											value: "state_property_silb",
											label: tEnum(
												"enumMap.field_names.owner_type.options.state_property_silb",
											),
										},
										{
											value: "state_property_soda",
											label: tEnum(
												"enumMap.field_names.owner_type.options.state_property_soda",
											),
										},
										{
											value: "state_property_other",
											label: tEnum(
												"enumMap.field_names.owner_type.options.state_property_other",
											),
										},
										{
											value: "state_property_specialized",
											label: tEnum(
												"enumMap.field_names.owner_type.options.state_property_specialized",
											),
										},
										{
											value: "state_property_fund",
											label: tEnum(
												"enumMap.field_names.owner_type.options.state_property_fund",
											),
										},
										{
											value: "district_property",
											label: tEnum(
												"enumMap.field_names.owner_type.options.district_property",
											),
										},
										{
											value: "other_public_property",
											label: tEnum(
												"enumMap.field_names.owner_type.options.other_public_property",
											),
										},
										{
											value: "municipal_housing_company",
											label: tEnum(
												"enumMap.field_names.owner_type.options.municipal_housing_company",
											),
										},
										{
											value: "other",
											label: tEnum(
												"enumMap.field_names.owner_type.options.other",
											),
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
								"content.institutionFormModal.form.information.accordions.rental.title",
							),
							accordionDescription: t(
								"content.institutionFormModal.form.information.accordions.rental.description",
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
												"enumMap.field_names.rental_contract_type.options.unlimited_lease",
											),
										},
										{
											value: "limited_lease",
											label: tEnum(
												"enumMap.field_names.rental_contract_type.options.limited_lease",
											),
										},
										{
											value: "hereditary_building_right",
											label: tEnum(
												"enumMap.field_names.rental_contract_type.options.hereditary_building_right",
											),
										},
										{
											value: "organization_ownership",
											label: tEnum(
												"enumMap.field_names.rental_contract_type.options.organization_ownership",
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
								"content.institutionFormModal.form.information.accordions.protection.title",
							),
							accordionDescription: t(
								"content.institutionFormModal.form.information.accordions.protection.description",
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
										"enumMap.field_names.protection_status.options.none",
									),
									type: "select",
									options: [
										{
											value: "long_term_secured",
											label: tEnum(
												"enumMap.field_names.protection_status.options.long_term_secured",
											),
										},
										{
											value: "medium_term_secured",
											label: tEnum(
												"enumMap.field_names.protection_status.options.medium_term_secured",
											),
										},
										{
											value: "uncertain",
											label: tEnum(
												"enumMap.field_names.protection_status.options.uncertain",
											),
										},
										{
											value: "acutely_threatened",
											label: tEnum(
												"enumMap.field_names.protection_status.options.acutely_threatened",
											),
										},
										{
											value: "permanently_closed",
											label: tEnum(
												"enumMap.field_names.protection_status.options.permanently_closed",
											),
										},
										{
											value: "not_yet_secured",
											label: tEnum(
												"enumMap.field_names.protection_status.options.not_yet_secured",
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
								"content.institutionFormModal.form.information.accordions.space.title",
							),
							accordionDescription: t(
								"content.institutionFormModal.form.information.accordions.space.description",
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
									label: fieldLabel(
										"number_of_rooms",
										"Anzahl der Arbeitsräume",
									),
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
								"content.institutionFormModal.form.information.internalNotesPrivateDescription",
							),
						},
					],
				},
			],

			initialValues: draft,
			onChange: handleStepChange,
			onSubmit: handleStepSubmit,
			onCancel: handleCancel,
			cancelLabel: t("content.institutionDraftWizardModal.actions.back"),
			submitLabel: t("content.institutionDraftWizardModal.actions.next"),
			showCancel: true,
			isPrivateField: isPrivateFormField,
		}),
		[
			draft,
			handleCancel,
			handleStepChange,
			handleStepSubmit,
			fieldLabel,
			isPrivateFormField,
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
					title: t("content.institutionFormModal.form.contact.consent.title"),
					layout: { span: "full" },
					fields: [
						{
							name: "works_for_organization",
							label: t(
								"content.institutionFormModal.form.contact.consent.worksForOrganization",
							),
							type: "radio",
							radioVariant: "button",
							options: [
								{
									value: true,
									label: t(
										"content.institutionFormModal.form.contact.consent.worksForOrganizationOptions.yes",
									),
								},
								{
									value: false,
									label: t(
										"content.institutionFormModal.form.contact.consent.worksForOrganizationOptions.no",
									),
								},
							],

							defaultValue: false,
						},
						{
							name: "consent_contact_listing",
							label: t(
								"content.institutionFormModal.form.contact.consent.contactListing",
							),
							condition: (formData) => formData.works_for_organization === true,
							type: "radio",
							radioVariant: "button",
							options: [
								{
									value: true,
									label: t(
										"content.institutionFormModal.form.contact.consent.worksForOrganizationOptions.yes",
									),
								},
								{
									value: false,
									label: t(
										"content.institutionFormModal.form.contact.consent.worksForOrganizationOptions.no",
									),
								},
							],

							defaultValue: false,
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
							label: fieldLabel("contact_person_first_name"),
							type: "text",
							defaultValue: contactProfile?.first_name || "",
							placeholder: fieldPlaceholder("contact_person_first_name"),
							layout: { span: "half" },
						},
						{
							name: "contact_person_last_name",
							label: fieldLabel("contact_person_last_name"),
							type: "text",
							defaultValue: contactProfile?.last_name || "",
							placeholder: fieldPlaceholder("contact_person_last_name"),
							layout: { span: "half" },
						},
						{
							name: "contact_person_email",
							label: fieldLabel("contact_person_email"),
							type: "email",
							defaultValue: contactProfile?.email || "",
							placeholder: fieldPlaceholder("contact_person_email"),
							layout: { span: "full" },
						},
						{
							name: "contact_person_phone",
							label: fieldLabel("contact_person_phone"),
							type: "tel",
							defaultValue: contactProfile?.phone || "",
							placeholder: fieldPlaceholder("contact_person_phone"),
							layout: { span: "full" },
						},
					],
				},
			],

			initialValues: draft,
			onChange: handleStepChange,
			onSubmit: handleStepSubmit,
			onCancel: handleCancel,
			cancelLabel: t("content.institutionDraftWizardModal.actions.back"),
			submitLabel: t("content.institutionDraftWizardModal.actions.review"),
			showCancel: true,
			isPrivateField: isPrivateFormField,
		}),
		[
			draft,
			handleCancel,
			handleStepChange,
			handleStepSubmit,
			isPrivateFormField,
			contactProfile,
			t,
		],
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
				t(`content.institutionDraftWizardModal.steps.${stepKey}.title`) ||
				title ||
				"",
			subtitle:
				t(`content.institutionDraftWizardModal.steps.${stepKey}.subtitle`) ||
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
				<div className="mb-8 flex flex-col items-center space-y-2 md:mx-24">
					<StepIndicator />
					<span className="body2">
						{t("content.institutionDraftWizardModal.stepLabel", {
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
								setSectionHash(sectionId);
								setEditSectionId(sectionId);
								setEditModalOpen(true);
							}}
						/>
					</section>
					<div className="flex items-center justify-end">
						<Button
							id="institution-draft-submit-button"
							onClick={() => void handleReviewSubmit()}
						>
							{t("content.institutionDraftWizardModal.actions.submit")}
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
					institution={buildInstitutionForFormFromDraft(draft, categoryGroups)}
					profile={contactProfile}
					onClose={closeSectionEditModal}
					onSubmit={({ data }) => {
						handleSectionEditSubmit(data as Record<string, unknown>);
					}}
					formKey={`draft-edit-${editSectionId ?? "default"}`}
					closeOnSubmit
					submitLabel={t("content.institutionFormModal.actions.save")}
				/>
			) : null}
		</div>
	);
}

export function InstitutionDraftWizardModal({
	initialStepId,
	routePath,
	profile,
}: {
	initialStepId?: string;
	routePath?: string;
	profile: Profile | null;
}) {
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const { t } = useTranslation();
	const closeModal = useRoutedModalClose({});
	const storedStepId = useInstitutionDraftStore((state) => state.stepId);
	const setStepId = useInstitutionDraftStore((state) => state.setStepId);
	const draftMode = useInstitutionDraftStore((state) => state.mode);
	const isUpdateReviewOnly = draftMode === "update";
	const [submitError, setSubmitError] = useState<string | null>(null);
	const stepConfigs = useMemo<StepConfig[]>(
		() =>
			STEP_IDS.map((id) => ({
				id,
				icon: null,
				title: t(`content.institutionDraftWizardModal.steps.${id}.title`),
				description: t(
					`content.institutionDraftWizardModal.steps.${id}.subtitle`,
				),
			})),
		[t],
	);
	const reviewOnlySteps = useMemo(
		() => stepConfigs.filter((step) => step.id === "review"),
		[stepConfigs],
	);
	const resolvedSteps = isUpdateReviewOnly ? reviewOnlySteps : stepConfigs;
	const isValidStep = STEP_IDS.some((stepId) => stepId === initialStepId);
	const resolvedStepId = isValidStep ? initialStepId : storedStepId;
	const handleSubmitted = () => {
		const targetPath = toLocalePath("/institution?thankyou=1");
		router.replace(targetPath);
		showSuccessToast(
			t("content.institutionDraftWizardModal.feedback.submit.title", {
				defaultValue: "Submission sent",
			}),
			t("content.institutionDraftWizardModal.feedback.submit.description", {
				defaultValue: "Your submission has been sent for review.",
			}),
		);
		// queueMicrotask(() => {
		// 	resetDraft();
		// });
	};

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
			title={t("content.institutionDraftWizardModal.dialog.create.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			backTo="/institution"
			showBackButton={storedStepId === "basic" || isUpdateReviewOnly}
			closeConfirmation={{
				title: t("content.institutionModalCloseConfirmation.title"),
				description: t("content.institutionModalCloseConfirmation.description"),
				confirmLabel: t("content.institutionModalCloseConfirmation.confirm"),
				cancelLabel: t("content.institutionModalCloseConfirmation.cancel"),
			}}
			containerClassName=""
			contentWrapperClassName="flex-1"
			contentClassName=""
			errorDialog={
				submitError
					? {
							open: true,
							title: t("common.error"),
							description: submitError,
							confirmLabel: t("common.close"),
							onConfirm: () => setSubmitError(null),
							onOpenChange: (open) => {
								if (!open) setSubmitError(null);
							},
						}
					: undefined
			}
		>
			<div className="flex min-h-full flex-col md:bg-background py-10 space-y-10">
				<HorizontalStepper
					steps={resolvedSteps}
					initialStepId={isUpdateReviewOnly ? "review" : resolvedStepId}
				>
					<InstitutionDraftWizardContent
						title={t("content.institutionDraftWizardModal.dialog.create.title")}
						subtitle={t(
							"content.institutionDraftWizardModal.dialog.create.subtitle",
						)}
						onSubmitted={handleSubmitted}
						onCloseRequest={closeModal}
						profile={profile}
						onSubmitError={(message) => setSubmitError(message)}
					/>
				</HorizontalStepper>
			</div>
		</Modal>
	);
}
