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
import { buildAddressFromFormData } from "@/lib/utils/formUtils";
import { resolveCategoryIdsFromDraft } from "@/lib/utils/institutionCategoryUtils";
import { QuestionnaireConsentStep } from "@/components/Questionnaire/QuestionnaireConsentStep";
import { QuestionnaireInstitutionLinkStep } from "@/components/Questionnaire/QuestionnaireInstitutionLinkStep";
import { QuestionnaireBlockStep } from "@/components/Questionnaire/QuestionnaireBlockStep";
import { QuestionnaireThankYou } from "@/components/Questionnaire/QuestionnaireThankYou";
import type { Category } from "@/types";
import type { CaptchaWidgetConfig } from "@/types/captcha";
import { useGuestCaptcha } from "@/components/Captcha/useGuestCaptcha";

type QuestionnaireWithQuestions = {
	id: number;
	meta_data?: unknown;
	questions: Question[];
};

const splitFreeTextList = (value: unknown): string[] =>
	typeof value === "string"
		? Array.from(
				new Set(
					value
						.split(",")
						.map((item) => item.trim())
						.filter((item) => item.length > 0),
				),
			)
		: [];

// Turns the compact institution-create form's raw field data into the shape
// submitQuestionnaireAnswers' newInstitution param expects — the same
// transformation QuestionnaireInstitutionCreateForm used to do itself before
// calling createSubmission directly. Done here instead, at final-submit time,
// so nothing is written to the DB until the whole questionnaire is submitted.
const buildNewInstitutionPayload = (
	data: Record<string, unknown>,
	categoryGroups: Category[],
) => ({
	name: data.name,
	address: buildAddressFromFormData(data),
	categoryIds: resolveCategoryIdsFromDraft(data, categoryGroups),
	established_since: data.established_since,
	newCategoryKeys: splitFreeTextList(data.newCategory),
});

// Exactly one of institutionId/submissionId/pendingInstitutionData is ever set
// on the draft — this resolves whichever is present into the shape
// submitQuestionnaireAnswers expects, or null if neither is set yet.
const resolveAnswerTarget = (params: {
	institutionId: number | null;
	submissionId: number | null;
	pendingInstitutionData: Record<string, unknown> | null;
	categoryGroups: Category[];
}):
	| { institutionId: number }
	| { submissionId: number }
	| { newInstitution: ReturnType<typeof buildNewInstitutionPayload> }
	| null => {
	if (params.institutionId !== null) {
		return { institutionId: params.institutionId };
	}
	if (params.submissionId !== null) {
		return { submissionId: params.submissionId };
	}
	if (params.pendingInstitutionData !== null) {
		return {
			newInstitution: buildNewInstitutionPayload(
				params.pendingInstitutionData,
				params.categoryGroups,
			),
		};
	}
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

const syncQuestionnaireStepUrl = (
	step: string,
	institutionId: number | null,
	submissionId: number | null,
) => {
	if (typeof window === "undefined") return;
	const url = new URL(window.location.href);
	url.searchParams.set("step", step);
	url.searchParams.delete("thankyou");
	if (institutionId !== null) {
		url.searchParams.set("institutionId", String(institutionId));
	} else {
		url.searchParams.delete("institutionId");
	}
	if (submissionId !== null) {
		url.searchParams.set("submissionId", String(submissionId));
	} else {
		url.searchParams.delete("submissionId");
	}
	window.history.replaceState(null, "", url);
};

const syncQuestionnaireThankYouUrl = () => {
	if (typeof window === "undefined") return;
	const url = new URL(window.location.href);
	url.searchParams.set("thankyou", "1");
	url.searchParams.delete("step");
	url.searchParams.delete("institutionId");
	url.searchParams.delete("submissionId");
	window.history.replaceState(null, "", url);
};

export function QuestionnaireWizardContent({
	questionnaire,
	categoryGroups,
	onSubmitError,
	initialInstitutionId,
	initialSubmissionId,
	initialShowThankYou,
	captchaConfig = null,
}: {
	questionnaire: QuestionnaireWithQuestions;
	categoryGroups: Category[];
	onSubmitError?: (message: string) => void;
	initialInstitutionId?: number;
	initialSubmissionId?: number;
	initialShowThankYou?: boolean;
	captchaConfig?: CaptchaWidgetConfig | null;
}) {
	const { t, i18n } = useTranslation();
	const captcha = useGuestCaptcha(captchaConfig);
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
	const pendingInstitutionData = useQuestionnaireDraftStore(
		(s) => s.pendingInstitutionData,
	);
	const setPendingInstitutionData = useQuestionnaireDraftStore(
		(s) => s.setPendingInstitutionData,
	);
	const answers = useQuestionnaireDraftStore((s) => s.answers);
	const setAnswers = useQuestionnaireDraftStore((s) => s.setAnswers);
	const ensureQuestionnaire = useQuestionnaireDraftStore(
		(s) => s.ensureQuestionnaire,
	);
	const resetDraft = useQuestionnaireDraftStore((s) => s.reset);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(initialShowThankYou ?? false);

	useEffect(() => {
		ensureQuestionnaire(questionnaire.id);
		const store = useQuestionnaireDraftStore.getState();
		if (
			initialInstitutionId !== undefined &&
			store.institutionId !== initialInstitutionId
		) {
			store.setIsInstitutionRegistered(true);
			store.setInstitutionId(initialInstitutionId);
		} else if (
			initialSubmissionId !== undefined &&
			store.submissionId !== initialSubmissionId
		) {
			store.setIsInstitutionRegistered(false);
			store.setSubmissionId(initialSubmissionId);
		}
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
		setStepValidation(
			"consent",
			() => useQuestionnaireDraftStore.getState().consentGiven,
		);
	}, [setStepValidation]);

	useEffect(() => {
		setStepValidation("institution-link", () => {
			const state = useQuestionnaireDraftStore.getState();
			return (
				(state.isInstitutionRegistered === true &&
					state.institutionId !== null) ||
				(state.isInstitutionRegistered === false &&
					(state.submissionId !== null ||
						state.pendingInstitutionData !== null))
			);
		});
	}, [setStepValidation]);

	useEffect(() => {
		const step = Number(currentStepId.replace("block-", ""));
		const group = stepGroups.find((g) => g.step === step);
		if (!group) return;
		const fields = group.questions.map((question) =>
			buildFieldConfigFromQuestion(question, locale),
		);
		setStepValidation(currentStepId, () =>
			isBlockStepValid(fields, useQuestionnaireDraftStore.getState().answers),
		);
	}, [currentStepId, stepGroups, locale, setStepValidation]);

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

	useEffect(() => {
		if (isSubmitted) return;
		syncQuestionnaireStepUrl(currentStepId, institutionId, submissionId);
	}, [currentStepId, institutionId, submissionId, isSubmitted]);

	const handleSubmit = useCallback(
		async (submissionAnswers: Record<string, unknown>) => {
			const target = resolveAnswerTarget({
				institutionId,
				submissionId,
				pendingInstitutionData,
				categoryGroups,
			});
			if (!target) return;
			if (!captcha.isSolved) {
				onSubmitError?.(t("common.captcha.hint"));
				return;
			}
			setIsSubmitting(true);

			const rows = buildAnswerRowsFromDraft(
				visibleQuestions,
				submissionAnswers,
			);
			const result = await submitQuestionnaireAnswers({
				questionnaireId: questionnaire.id,
				...target,
				answers: rows,
				captchaToken: captcha.token,
			});

			setIsSubmitting(false);
			captcha.reset();
			if (!result.ok) {
				const message =
					result.error === "captcha_failed"
						? t("common.captcha.failed")
						: result.error === "already_submitted"
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
			resetDraft();
			syncQuestionnaireThankYouUrl();
		},
		[
			institutionId,
			submissionId,
			pendingInstitutionData,
			categoryGroups,
			visibleQuestions,
			questionnaire.id,
			t,
			onSubmitError,
			resetDraft,
			captcha.isSolved,
			captcha.token,
			captcha.reset,
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
				pendingInstitutionData={pendingInstitutionData}
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
					if (patch.pendingInstitutionData !== undefined) {
						setPendingInstitutionData(patch.pendingInstitutionData);
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
			footerContent={isLastBlock ? captcha.widget : null}
		/>
	);
}
