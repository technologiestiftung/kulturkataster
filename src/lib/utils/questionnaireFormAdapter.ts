import type { Prisma, Question } from "@/generated/prisma";
import type { FormWrapperConfig, FormWrapperFieldConfig } from "@/components/FormWrapper/types";

const SUPPORTED_QUESTION_FIELD_TYPES = [
	"text",
	"textarea",
	"radio",
	"likert",
	"select",
	"checkbox",
] as const;

type SupportedQuestionFieldType = (typeof SUPPORTED_QUESTION_FIELD_TYPES)[number];

const isSupportedFieldType = (
	value: string,
): value is SupportedQuestionFieldType =>
	(SUPPORTED_QUESTION_FIELD_TYPES as readonly string[]).includes(value);

type QuestionConfig = {
	options?: { value: string | number | boolean; label: string }[];
	freeTextOption?: {
		value: string | number | boolean;
		fieldName?: string;
		placeholder?: string;
		label?: string;
	};
	radioVariant?: "default" | "button";
	placeholder?: string;
	allowNullOption?: boolean;
};

const getQuestionConfig = (question: Question): QuestionConfig =>
	(question.config as QuestionConfig | null) ?? {};

// Question.step is just a number — there's no dedicated "block title" column in the
// schema. Convention (not dictated by the schema, documented here): a block's
// display title/description are looked up from Questionnaire.meta_data.blocks[step],
// which is a free-form Json field designed as an extension point. Falls back to a
// generic "Themenblock N" label when unseeded, so this degrades gracefully.
export function getBlockMeta(
	questionnaire: { meta_data?: unknown },
	step: number,
): { title: string; description?: string } {
	const meta =
		(questionnaire.meta_data as
			| { blocks?: Record<string, { title?: string; description?: string }> }
			| null
			| undefined) ?? {};
	const block = meta.blocks?.[String(step)];
	return {
		title: block?.title ?? `Themenblock ${step}`,
		description: block?.description,
	};
}

export function groupQuestionsByStep(
	questions: Question[],
): { step: number; questions: Question[] }[] {
	const groups: { step: number; questions: Question[] }[] = [];
	const indexByStep = new Map<number, number>();

	questions.forEach((question) => {
		const existingIndex = indexByStep.get(question.step);
		if (existingIndex === undefined) {
			indexByStep.set(question.step, groups.length);
			groups.push({ step: question.step, questions: [question] });
		} else {
			groups[existingIndex].questions.push(question);
		}
	});

	return groups;
}

export function buildFieldConfigFromQuestion(
	question: Question,
): Exclude<FormWrapperFieldConfig, { type: "section" }> {
	const config = getQuestionConfig(question);
	let fieldType: SupportedQuestionFieldType = "text";
	if (isSupportedFieldType(question.field_type)) {
		fieldType = question.field_type;
	} else {
		console.warn("questionnaire.unsupported_field_type", {
			field_type: question.field_type,
			key: question.key,
		});
	}

	return {
		name: question.key,
		label: question.label,
		description: question.description ?? undefined,
		type: fieldType,
		required: question.required,
		...(config.options ? { options: config.options } : {}),
		...(config.freeTextOption ? { freeTextOption: config.freeTextOption } : {}),
		...(config.radioVariant ? { radioVariant: config.radioVariant } : {}),
		...(config.placeholder ? { placeholder: config.placeholder } : {}),
		...(config.allowNullOption !== undefined
			? { allowNullOption: config.allowNullOption }
			: {}),
	} as Exclude<FormWrapperFieldConfig, { type: "section" }>;
}

export function buildQuestionnaireStepFormConfig(params: {
	questions: Question[];
	initialValues?: Record<string, unknown>;
	onChange: (data: Record<string, unknown>) => void;
	onSubmit: (data: Record<string, unknown>) => void;
	onCancel: () => void;
	submitLabel: string;
	cancelLabel: string;
}): FormWrapperConfig {
	const { questions, initialValues, onChange, onSubmit, onCancel, submitLabel, cancelLabel } =
		params;

	return {
		fields: questions.map(buildFieldConfigFromQuestion),
		initialValues,
		onChange,
		onSubmit,
		onCancel,
		submitLabel,
		cancelLabel,
		showCancel: true,
	};
}

export function buildAnswerRowsFromDraft(
	questions: Question[],
	draft: Record<string, unknown>,
): { questionId: number; value: Prisma.InputJsonValue }[] {
	const rows: { questionId: number; value: Prisma.InputJsonValue }[] = [];

	questions.forEach((question) => {
		const rawValue = draft[question.key];
		if (rawValue === undefined || rawValue === null || rawValue === "") {
			return;
		}

		const config = getQuestionConfig(question);
		const freeTextOption = config.freeTextOption;
		if (
			question.field_type === "radio" &&
			freeTextOption &&
			String(rawValue) === String(freeTextOption.value)
		) {
			const freeTextFieldName = freeTextOption.fieldName ?? `${question.key}FreeText`;
			rows.push({
				questionId: question.id,
				value: {
					selected: rawValue as Prisma.InputJsonValue,
					freeText: (draft[freeTextFieldName] as string) ?? "",
				},
			});
			return;
		}

		rows.push({
			questionId: question.id,
			value: rawValue as Prisma.InputJsonValue,
		});
	});

	return rows;
}
