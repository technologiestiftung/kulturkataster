"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Question } from "@/generated/prisma";
import { useHorizontalStepper } from "@/components/HorizontalStepper";
import { useQuestionnaireDraftStore } from "@/lib/store/questionnaireDraftStore";
import { submitQuestionnaireAnswers } from "@/server/actions/questionnaires";
import {
	buildAnswerRowsFromDraft,
	buildFieldConfigFromQuestion,
	filterQuestionsForInstitutionStatus,
	groupQuestionsByStep,
	type QuestionnaireLocale,
} from "@/lib/utils/questionnaireFormAdapter";
import { QuestionnaireConsentStep } from "@/components/Questionnaire/QuestionnaireConsentStep";
import { QuestionnaireInstitutionLinkStep } from "@/components/Questionnaire/QuestionnaireInstitutionLinkStep";
import { QuestionnaireBlockStep } from "@/components/Questionnaire/QuestionnaireBlockStep";
import { QuestionnaireThankYou } from "@/components/Questionnaire/QuestionnaireThankYou";
import type { Category } from "@/types";

type QuestionnaireWithQuestions = {
	id: number;
	meta_data?: unknown;
	questions: Question[];
};

// Exactly one of institutionId/submissionId is ever set on the draft — this
// resolves whichever is present into the shape submitQuestionnaireAnswers/
// checkQuestionnaireCompletion expect, or null if neither is set yet.
const resolveAnswerTarget = (
	institutionId: number | null,
	submissionId: number | null,
): { institutionId: number } | { submissionId: number } | null => {
	if (institutionId !== null) return { institutionId };
	if (submissionId !== null) return { submissionId };
	return null;
};

const hasRequiredValue = (value: unknown) => {
	if (Array.isArray(value)) return value.length > 0;
	return value !== undefined && value !== null && value !== "";
};

const isLikertMatrixComplete = (
	field: ReturnType<typeof buildFieldConfigFromQuestion>,
	value: unknown,
) => {
	const matrixValue =
		value && typeof value === "object"
			? (value as Record<string, unknown>)
			: {};
	const rows = field.likertMatrix?.rows ?? [];
	return (
		rows.length > 0 &&
		rows.every((row) => hasRequiredValue(matrixValue[row.key]))
	);
};

// Mirrors InstitutionDraftWizardModal's getStepValidatableFields/validateStepFieldValue
// pattern: forward-jumping via the clickable block dots must respect required fields,
// same as clicking "Weiter" does.
const isBlockStepValid = (
	fields: ReturnType<typeof buildFieldConfigFromQuestion>[],
	formData: Record<string, unknown>,
) =>
	fields
		.filter((field) => !field.condition || field.condition(formData))
		.every((field) => {
			if (!field.required) return true;
			const value = formData[field.name];
			if (field.type === "checkbox") return value === true;
			if (field.type === "likertMatrix") {
				return isLikertMatrixComplete(field, value);
			}
			return hasRequiredValue(value);
		});

export function QuestionnaireWizardContent({
	questionnaire,
	categoryGroups,
	onSubmitError,
}: {
	questionnaire: QuestionnaireWithQuestions;
	categoryGroups: Category[];
	onSubmitError?: (message: string) => void;
}) {
	const { t, i18n } = useTranslation();
	const locale: QuestionnaireLocale = i18n.language?.startsWith("en")
		? "en"
		: "de";
	const { currentStepId, nextStep, previousStep, goToStep, setStepValidation } =
		useHorizontalStepper();

	const consentGiven = useQuestionnaireDraftStore((s) => s.consentGiven);
	const setConsent = useQuestionnaireDraftStore((s) => s.setConsent);
	const isInstitutionRegistered = useQuestionnaireDraftStore(
		(s) => s.isInstitutionRegistered,
	);
	const setIsInstitutionRegistered = useQuestionnaireDraftStore(
		(s) => s.setIsInstitutionRegistered,
	);
	const institutionId = useQuestionnaireDraftStore((s) => s.institutionId);
	const setInstitutionId = useQuestionnaireDraftStore(
		(s) => s.setInstitutionId,
	);
	const submissionId = useQuestionnaireDraftStore((s) => s.submissionId);
	const setSubmissionId = useQuestionnaireDraftStore((s) => s.setSubmissionId);
	const answers = useQuestionnaireDraftStore((s) => s.answers);
	const setAnswers = useQuestionnaireDraftStore((s) => s.setAnswers);
	const ensureQuestionnaire = useQuestionnaireDraftStore(
		(s) => s.ensureQuestionnaire,
	);
	const resetDraft = useQuestionnaireDraftStore((s) => s.reset);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	useEffect(() => {
		ensureQuestionnaire(questionnaire.id);
	}, [questionnaire.id, ensureQuestionnaire]);

	const visibleQuestions = useMemo(
		() =>
			filterQuestionsForInstitutionStatus(
				questionnaire.questions,
				isInstitutionRegistered === true,
			),
		[questionnaire.questions, isInstitutionRegistered],
	);

	const stepGroups = useMemo(
		() => groupQuestionsByStep(visibleQuestions),
		[visibleQuestions],
	);

	useEffect(() => {
		setStepValidation("consent", () => consentGiven);
	}, [consentGiven, setStepValidation]);

	useEffect(() => {
		setStepValidation(
			"institution-link",
			() =>
				(isInstitutionRegistered === true && institutionId !== null) ||
				(isInstitutionRegistered === false && submissionId !== null),
		);
	}, [isInstitutionRegistered, institutionId, submissionId, setStepValidation]);

	useEffect(() => {
		const step = Number(currentStepId.replace("block-", ""));
		const group = stepGroups.find((g) => g.step === step);
		if (!group) return;
		setStepValidation(currentStepId, () =>
			isBlockStepValid(
				group.questions.map((question) =>
					buildFieldConfigFromQuestion(question, locale),
				),
				answers,
			),
		);
	}, [currentStepId, stepGroups, answers, locale, setStepValidation]);

	// Mirrors InstitutionDraftWizardModal's scrollStepContainerToTop: the modal body
	// (not the window) is what scrolls, so advancing/going back needs to reset its
	// scroll position — otherwise a step you scrolled through stays scrolled on the
	// next one.
	useEffect(() => {
		if (typeof window === "undefined") return;
		const modalRoot = document.querySelector(
			".Modal-Root",
		) as HTMLElement | null;
		if (modalRoot) {
			modalRoot.scrollTo({ top: 0, behavior: "auto" });
			return;
		}
		window.scrollTo({ top: 0, behavior: "auto" });
	}, [currentStepId]);

	// Takes the answers to submit explicitly rather than reading the `answers` store
	// value from closure: the last block's own onSubmit calls this in the same tick
	// as merging that block's data in, before a re-render would make the merged
	// value available via the hook.
	const handleSubmit = useCallback(
		async (submissionAnswers: Record<string, unknown>) => {
			const target = resolveAnswerTarget(institutionId, submissionId);
			if (!target) return;
			setIsSubmitting(true);

			const rows = buildAnswerRowsFromDraft(
				visibleQuestions,
				submissionAnswers,
			);
			const result = await submitQuestionnaireAnswers({
				questionnaireId: questionnaire.id,
				...target,
				answers: rows,
			});

			setIsSubmitting(false);
			if (!result.ok) {
				const message =
					result.error === "already_submitted"
						? t(
								"content.questionnaireWizard.institutionLink.alreadySubmitted",
								{
									defaultValue:
										"Für diesen Kulturort wurde diese Befragung bereits ausgefüllt.",
								},
							)
						: t("content.questionnaireWizard.review.submitError", {
								defaultValue:
									"Beim Absenden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
							});
				onSubmitError?.(message);
				return;
			}
			setIsSubmitted(true);
			// The store persists to localStorage — without clearing it, revisiting
			// /questionnaire later would restart at "consent" (the stepper's own
			// position isn't persisted) but still carry the just-submitted
			// institution/submission, wrongly hitting the "already submitted" guard
			// the moment the respondent reaches the institution-link step again.
			resetDraft();
		},
		[
			institutionId,
			submissionId,
			visibleQuestions,
			questionnaire.id,
			t,
			onSubmitError,
			resetDraft,
		],
	);

	if (isSubmitted) {
		return <QuestionnaireThankYou />;
	}

	if (currentStepId === "consent") {
		return (
			<QuestionnaireConsentStep
				consentGiven={consentGiven}
				onConsentChange={setConsent}
				onNext={nextStep}
			/>
		);
	}

	if (currentStepId === "institution-link") {
		return (
			<QuestionnaireInstitutionLinkStep
				questionnaireId={questionnaire.id}
				isInstitutionRegistered={isInstitutionRegistered}
				institutionId={institutionId}
				categoryGroups={categoryGroups}
				onChange={(patch) => {
					if (patch.isInstitutionRegistered !== undefined) {
						setIsInstitutionRegistered(patch.isInstitutionRegistered);
					}
					if (patch.institutionId !== undefined) {
						setInstitutionId(patch.institutionId);
					}
					if (patch.submissionId !== undefined) {
						setSubmissionId(patch.submissionId);
					}
				}}
				onBack={previousStep}
				onNext={nextStep}
			/>
		);
	}

	const step = Number(currentStepId.replace("block-", ""));
	const blockIndex = stepGroups.findIndex((group) => group.step === step);
	const group = stepGroups[blockIndex];
	if (!group) return null;

	const isLastBlock = blockIndex === stepGroups.length - 1;

	return (
		<QuestionnaireBlockStep
			questionnaire={questionnaire}
			step={group.step}
			questions={group.questions}
			locale={locale}
			blockIndex={blockIndex}
			totalBlocks={stepGroups.length}
			blockStepIds={stepGroups.map((g) => `block-${g.step}`)}
			onNavigateToStep={goToStep}
			initialValues={answers}
			onChange={setAnswers}
			onSubmit={(data) => {
				setAnswers(data);
				if (isLastBlock) {
					void handleSubmit({ ...answers, ...data });
					return;
				}
				nextStep();
			}}
			onBack={previousStep}
			nextLabel={
				isLastBlock
					? t("content.questionnaireWizard.review.submit", {
							defaultValue: "Absenden",
						})
					: t("common.next", { defaultValue: "Weiter" })
			}
			backLabel={t("common.back", { defaultValue: "Zurück" })}
			submitDisabled={isLastBlock ? isSubmitting : undefined}
		/>
	);
}
