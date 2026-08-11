"use client";

import type { Question } from "@/generated/prisma";
import { Card } from "@/components/ui/card";
import { FormWrapper } from "@/components/FormWrapper";
import { QuestionnaireBlockDots } from "@/components/Questionnaire/QuestionnaireBlockDots";
import {
	buildQuestionnaireStepFormConfig,
	getBlockMeta,
} from "@/lib/utils/questionnaireFormAdapter";

export function QuestionnaireBlockStep({
	questionnaire,
	step,
	questions,
	blockIndex,
	totalBlocks,
	initialValues,
	onChange,
	onSubmit,
	onBack,
	nextLabel,
	backLabel,
}: {
	questionnaire: { meta_data?: unknown };
	step: number;
	questions: Question[];
	blockIndex: number;
	totalBlocks: number;
	initialValues: Record<string, unknown>;
	onChange: (data: Record<string, unknown>) => void;
	onSubmit: (data: Record<string, unknown>) => void;
	onBack: () => void;
	nextLabel: string;
	backLabel: string;
}) {
	const { title, description } = getBlockMeta(questionnaire, step);

	const config = buildQuestionnaireStepFormConfig({
		questions,
		initialValues,
		onChange,
		onSubmit,
		onCancel: onBack,
		submitLabel: nextLabel,
		cancelLabel: backLabel,
	});

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="font-bold">{title}</h1>
				{description && <p className="body2">{description}</p>}
			</div>

			<div className="mb-8 flex flex-col items-center space-y-2 md:mx-24">
				<QuestionnaireBlockDots total={totalBlocks} currentIndex={blockIndex} />
				<span className="body2">{`Themenblock ${blockIndex + 1}/${totalBlocks}`}</span>
			</div>

			<Card variant="secondary" className="space-y-6">
				<FormWrapper config={config} />
			</Card>
		</div>
	);
}
