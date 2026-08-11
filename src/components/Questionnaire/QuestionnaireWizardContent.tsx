"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Question } from "@/generated/prisma";
import { useHorizontalStepper } from "@/components/HorizontalStepper";
import { useQuestionnaireDraftStore } from "@/lib/store/questionnaireDraftStore";
import { submitQuestionnaireAnswers } from "@/server/actions/questionnaires";
import {
	buildAnswerRowsFromDraft,
	groupQuestionsByStep,
} from "@/lib/utils/questionnaireFormAdapter";
import { QuestionnaireConsentStep } from "@/components/Questionnaire/QuestionnaireConsentStep";
import { QuestionnaireInstitutionLinkStep } from "@/components/Questionnaire/QuestionnaireInstitutionLinkStep";
import { QuestionnaireBlockStep } from "@/components/Questionnaire/QuestionnaireBlockStep";
import { QuestionnaireReviewStep } from "@/components/Questionnaire/QuestionnaireReviewStep";

type QuestionnaireWithQuestions = {
	id: number;
	meta_data?: unknown;
	questions: Question[];
};

export function QuestionnaireWizardContent({
	questionnaire,
	isLoggedIn,
	onSubmitError,
}: {
	questionnaire: QuestionnaireWithQuestions;
	isLoggedIn: boolean;
	onSubmitError?: (message: string) => void;
}) {
	const { t } = useTranslation();
	const { currentStepId, nextStep, previousStep, setStepValidation } =
		useHorizontalStepper();

	const consentGiven = useQuestionnaireDraftStore((s) => s.consentGiven);
	const setConsent = useQuestionnaireDraftStore((s) => s.setConsent);
	const isRegistered = useQuestionnaireDraftStore((s) => s.isRegistered);
	const setIsRegistered = useQuestionnaireDraftStore((s) => s.setIsRegistered);
	const institutionId = useQuestionnaireDraftStore((s) => s.institutionId);
	const setInstitutionId = useQuestionnaireDraftStore(
		(s) => s.setInstitutionId,
	);
	const answers = useQuestionnaireDraftStore((s) => s.answers);
	const setAnswers = useQuestionnaireDraftStore((s) => s.setAnswers);
	const ensureQuestionnaire = useQuestionnaireDraftStore(
		(s) => s.ensureQuestionnaire,
	);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	useEffect(() => {
		ensureQuestionnaire(questionnaire.id);
	}, [questionnaire.id, ensureQuestionnaire]);

	const stepGroups = useMemo(
		() => groupQuestionsByStep(questionnaire.questions),
		[questionnaire.questions],
	);

	useEffect(() => {
		setStepValidation("consent", () => consentGiven);
	}, [consentGiven, setStepValidation]);

	useEffect(() => {
		setStepValidation(
			"institution-link",
			() => isRegistered === true && institutionId !== null,
		);
	}, [isRegistered, institutionId, setStepValidation]);

	useEffect(() => {
		stepGroups.forEach((group) => {
			setStepValidation(`block-${group.step}`, () => true);
		});
	}, [stepGroups, setStepValidation]);

	const handleSubmit = useCallback(async () => {
		if (institutionId === null) return;
		setIsSubmitting(true);
		setSubmitError(null);

		const rows = buildAnswerRowsFromDraft(questionnaire.questions, answers);
		const result = await submitQuestionnaireAnswers({
			questionnaireId: questionnaire.id,
			institutionId,
			answers: rows,
		});

		setIsSubmitting(false);
		if (!result.ok) {
			const message = t("content.questionnaireWizard.review.submitError", {
				defaultValue:
					"Beim Absenden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
			});
			setSubmitError(message);
			onSubmitError?.(message);
			return;
		}
		setIsSubmitted(true);
	}, [
		institutionId,
		questionnaire.questions,
		questionnaire.id,
		answers,
		t,
		onSubmitError,
	]);

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
				isRegistered={isRegistered}
				institutionId={institutionId}
				onChange={(patch) => {
					if (patch.isRegistered !== undefined) {
						setIsRegistered(patch.isRegistered);
					}
					if (patch.institutionId !== undefined) {
						setInstitutionId(patch.institutionId);
					}
				}}
				onBack={previousStep}
				onNext={nextStep}
			/>
		);
	}

	if (currentStepId === "review") {
		return (
			<QuestionnaireReviewStep
				isLoggedIn={isLoggedIn}
				isSubmitting={isSubmitting}
				isSubmitted={isSubmitted}
				submitError={submitError}
				onSubmit={handleSubmit}
				onBack={previousStep}
			/>
		);
	}

	const step = Number(currentStepId.replace("block-", ""));
	const blockIndex = stepGroups.findIndex((group) => group.step === step);
	const group = stepGroups[blockIndex];
	if (!group) return null;

	return (
		<QuestionnaireBlockStep
			questionnaire={questionnaire}
			step={group.step}
			questions={group.questions}
			blockIndex={blockIndex}
			totalBlocks={stepGroups.length}
			initialValues={answers}
			onChange={setAnswers}
			onSubmit={(data) => {
				setAnswers(data);
				nextStep();
			}}
			onBack={previousStep}
			nextLabel={t("common.next", { defaultValue: "Weiter" })}
			backLabel={t("common.back", { defaultValue: "Zurück" })}
		/>
	);
}
