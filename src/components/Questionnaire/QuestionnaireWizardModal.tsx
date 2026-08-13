"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Question } from "@/generated/prisma";
import {
	HorizontalStepper,
	type StepConfig,
} from "@/components/HorizontalStepper";
import { Modal } from "@/components/Modals/Modal";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";
import { groupQuestionsByStep } from "@/lib/utils/questionnaireFormAdapter";
import { QuestionnaireWizardContent } from "@/components/Questionnaire/QuestionnaireWizardContent";
import type { Category } from "@/types";

type QuestionnaireWithQuestions = {
	id: number;
	title: string;
	meta_data?: unknown;
	questions: Question[];
};

export function QuestionnaireWizardModal({
	routePath,
	questionnaire,
	categoryGroups,
	initialInstitutionId,
	initialSubmissionId,
	initialStepId,
	initialShowThankYou,
}: {
	routePath?: string;
	questionnaire: QuestionnaireWithQuestions;
	categoryGroups: Category[];
	initialInstitutionId?: number;
	initialSubmissionId?: number;
	initialStepId?: string;
	initialShowThankYou?: boolean;
}) {
	const { t } = useTranslation();
	const closeModal = useRoutedModalClose({});
	const [submitError, setSubmitError] = useState<string | null>(null);

	const stepGroups = useMemo(
		() => groupQuestionsByStep(questionnaire.questions),
		[questionnaire.questions],
	);

	const steps = useMemo<StepConfig[]>(
		() => [
			{ id: "consent", icon: null, title: "consent" },
			{ id: "institution-link", icon: null, title: "institution-link" },
			...stepGroups.map((group) => ({
				id: `block-${group.step}`,
				icon: null,
				title: `block-${group.step}`,
			})),
		],
		[stepGroups],
	);

	const initialWizardStepId =
		initialStepId && steps.some((step) => step.id === initialStepId)
			? initialStepId
			: undefined;

	return (
		<Modal
			title={questionnaire.title}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			containerClassName=""
			contentWrapperClassName="flex-1"
			contentClassName=""
			onCloseRequest={closeModal}
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
			<div className="flex min-h-full flex-col space-y-10 py-10 md:bg-background">
				<HorizontalStepper steps={steps} initialStepId={initialWizardStepId}>
					<QuestionnaireWizardContent
						questionnaire={questionnaire}
						categoryGroups={categoryGroups}
						onSubmitError={setSubmitError}
						initialInstitutionId={initialInstitutionId}
						initialSubmissionId={initialSubmissionId}
						initialShowThankYou={initialShowThankYou}
					/>
				</HorizontalStepper>
			</div>
		</Modal>
	);
}
