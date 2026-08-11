"use client";

import { useTranslation } from "react-i18next";
import type { Question } from "@/generated/prisma";
import { Card } from "@/components/ui/card";
import { FormWrapper } from "@/components/FormWrapper";
import { StepDots } from "@/components/HorizontalStepper";
import {
	buildQuestionnaireStepFormConfig,
	getBlockMeta,
	type QuestionnaireLocale,
} from "@/lib/utils/questionnaireFormAdapter";

export function QuestionnaireBlockStep({
	questionnaire,
	step,
	questions,
	locale,
	blockIndex,
	totalBlocks,
	blockStepIds,
	onNavigateToStep,
	initialValues,
	onChange,
	onSubmit,
	onBack,
	nextLabel,
	backLabel,
	submitDisabled,
}: {
	questionnaire: { meta_data?: unknown };
	step: number;
	questions: Question[];
	locale: QuestionnaireLocale;
	blockIndex: number;
	totalBlocks: number;
	blockStepIds: string[];
	onNavigateToStep: (stepId: string) => void;
	initialValues: Record<string, unknown>;
	onChange: (data: Record<string, unknown>) => void;
	onSubmit: (data: Record<string, unknown>) => void;
	onBack: () => void;
	nextLabel: string;
	backLabel: string;
	submitDisabled?: boolean;
}) {
	const { t } = useTranslation();
	const { title, description } = getBlockMeta(questionnaire, step, locale);

	const config = buildQuestionnaireStepFormConfig({
		questions,
		locale,
		initialValues,
		onChange,
		onSubmit,
		onCancel: onBack,
		submitLabel: nextLabel,
		cancelLabel: backLabel,
		submitDisabled,
	});

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="font-bold">{title}</h1>
				{description && <p className="body2">{description}</p>}
			</div>

			<div className="mb-8 flex flex-col items-center space-y-2 md:mx-24">
				<StepDots
					total={totalBlocks}
					currentIndex={blockIndex}
					onDotClick={(index) => onNavigateToStep(blockStepIds[index])}
				/>
				<span className="body2">
					{t("content.questionnaireWizard.block.stepLabel", {
						defaultValue: "Themenblock {{current}}/{{total}}",
						current: blockIndex + 1,
						total: totalBlocks,
					})}
				</span>
			</div>

			<Card variant="secondary" className="space-y-6">
				<FormWrapper config={config} />
			</Card>
		</div>
	);
}
