import type { Prisma, Question } from "@/generated/prisma";
import type {
	FormWrapperConfig,
	FormWrapperFieldConfig,
} from "@/components/FormWrapper/types";

const SUPPORTED_QUESTION_FIELD_TYPES = [
	"text",
	"textarea",
	"number",
	"radio",
	"likert",
	"likertMatrix",
	"select",
	"checkbox",
	"multiselect",
] as const;

type SupportedQuestionFieldType =
	(typeof SUPPORTED_QUESTION_FIELD_TYPES)[number];

const DEFAULT_TEXT_PLACEHOLDER = "Bitte eintragen";
const DEFAULT_TEXT_PLACEHOLDER_EN = "Please enter";
const FREE_TEXT_FIELD_TYPES: readonly SupportedQuestionFieldType[] = [
	"text",
	"textarea",
];

const isSupportedFieldType = (
	value: string,
): value is SupportedQuestionFieldType =>
	(SUPPORTED_QUESTION_FIELD_TYPES as readonly string[]).includes(value);

export type QuestionnaireLocale = "de" | "en";

type LocalizedOption = {
	value: string | number | boolean;
	label: string;
	label_en?: string;
};

type QuestionConfig = {
	options?: LocalizedOption[];
	freeTextOption?: {
		value: string | number | boolean;
		fieldName?: string;
		placeholder?: string;
		placeholder_en?: string;
		label?: string;
	};
	radioVariant?: "default" | "button";
	placeholder?: string;
	placeholder_en?: string;
	allowNullOption?: boolean;
	min?: number;
	max?: number;
	likertMatrix?: { rows: { key: string; label: string; label_en?: string }[] };
	condition?: {
		dependsOnKey: string;
		equals: string | number | boolean | (string | number | boolean)[];
	};
	onlyWhenNotRegistered?: boolean;
	// Show the question without a number; it doesn't count towards the numbering.
	hideNumber?: boolean;
};

const getQuestionConfig = (question: Question): QuestionConfig =>
	(question.config as QuestionConfig | null) ?? {};

// Only set min/max when seeded, so the field config stays free of undefined keys.
const resolveNumberRange = ({ min, max }: QuestionConfig) => ({
	...(min !== undefined ? { min } : {}),
	...(max !== undefined ? { max } : {}),
});

const resolveLocalizedText = (
	de: string,
	en: string | undefined | null,
	locale: QuestionnaireLocale,
): string => (locale === "en" && en ? en : de);

const resolveLocalizedOptions = (
	options: LocalizedOption[] | undefined,
	locale: QuestionnaireLocale,
): { value: string | number | boolean; label: string }[] | undefined =>
	options?.map((option) => ({
		value: option.value,
		label: resolveLocalizedText(option.label, option.label_en, locale),
	}));

const matchesCondition = (
	condition: NonNullable<QuestionConfig["condition"]>,
	formData: Record<string, unknown>,
): boolean => {
	const actual = formData[condition.dependsOnKey];
	if (Array.isArray(condition.equals)) {
		return condition.equals.some((expected) => expected === actual);
	}
	return condition.equals === actual;
};

const isQuestionVisible = (
	question: Question,
	formData: Record<string, unknown>,
): boolean => {
	const condition = getQuestionConfig(question).condition;
	return !condition || matchesCondition(condition, formData);
};

// Question.step is just a number — there's no dedicated "block title" column in the
// schema. Convention (not dictated by the schema, documented here): a block's
// display title/description are looked up from Questionnaire.meta_data.blocks[step],
// which is a free-form Json field designed as an extension point. Falls back to a
// generic "Themenblock N" label when unseeded, so this degrades gracefully.
type BlockMeta = {
	title?: string;
	title_en?: string;
	description?: string;
	description_en?: string;
};

export function getBlockMeta(
	questionnaire: { meta_data?: unknown },
	step: number,
	locale: QuestionnaireLocale = "de",
): { title: string; description?: string } {
	const meta =
		(questionnaire.meta_data as
			| { blocks?: Record<string, BlockMeta> }
			| null
			| undefined) ?? {};
	const block = meta.blocks?.[String(step)];
	const fallbackTitle = `Themenblock ${step}`;
	return {
		title: block?.title
			? resolveLocalizedText(block.title, block.title_en, locale)
			: fallbackTitle,
		description: block?.description
			? resolveLocalizedText(block.description, block.description_en, locale)
			: undefined,
	};
}

export function filterQuestionsForInstitutionStatus(
	questions: Question[],
	isInstitutionRegistered: boolean,
): Question[] {
	if (!isInstitutionRegistered) return questions;
	return questions.filter(
		(question) => !getQuestionConfig(question).onlyWhenNotRegistered,
	);
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

const resolveFieldType = (question: Question): SupportedQuestionFieldType => {
	if (isSupportedFieldType(question.field_type)) {
		return question.field_type;
	}
	console.warn("questionnaire.unsupported_field_type", {
		field_type: question.field_type,
		key: question.key,
	});
	return "text";
};

const resolveLocalizedFreeTextOption = (
	freeTextOption: QuestionConfig["freeTextOption"],
	locale: QuestionnaireLocale,
) =>
	freeTextOption
		? {
				value: freeTextOption.value,
				fieldName: freeTextOption.fieldName,
				label: freeTextOption.label,
				placeholder: freeTextOption.placeholder
					? resolveLocalizedText(
							freeTextOption.placeholder,
							freeTextOption.placeholder_en,
							locale,
						)
					: undefined,
			}
		: undefined;

const resolvePlaceholder = (
	config: QuestionConfig,
	fieldType: SupportedQuestionFieldType,
	locale: QuestionnaireLocale,
): string | undefined => {
	if (config.placeholder) {
		return resolveLocalizedText(
			config.placeholder,
			config.placeholder_en,
			locale,
		);
	}
	if (FREE_TEXT_FIELD_TYPES.includes(fieldType)) {
		return resolveLocalizedText(
			DEFAULT_TEXT_PLACEHOLDER,
			DEFAULT_TEXT_PLACEHOLDER_EN,
			locale,
		);
	}
	return undefined;
};

const resolveLocalizedLikertMatrix = (
	likertMatrix: QuestionConfig["likertMatrix"],
	locale: QuestionnaireLocale,
) =>
	likertMatrix
		? {
				rows: likertMatrix.rows.map((row) => ({
					key: row.key,
					label: resolveLocalizedText(row.label, row.label_en, locale),
				})),
			}
		: undefined;

export function buildFieldConfigFromQuestion(
	question: Question,
	locale: QuestionnaireLocale = "de",
): Exclude<FormWrapperFieldConfig, { type: "section" }> {
	const config = getQuestionConfig(question);
	const fieldType = resolveFieldType(question);
	const localizedFreeTextOption = resolveLocalizedFreeTextOption(
		config.freeTextOption,
		locale,
	);
	const localizedLikertMatrix = resolveLocalizedLikertMatrix(
		config.likertMatrix,
		locale,
	);
	const placeholder = resolvePlaceholder(config, fieldType, locale);

	return {
		name: question.key,
		label: resolveLocalizedText(question.label, question.label_en, locale),
		description: question.description
			? resolveLocalizedText(
					question.description,
					question.description_en,
					locale,
				)
			: undefined,
		type: fieldType,
		required: question.required,
		...(config.options
			? { options: resolveLocalizedOptions(config.options, locale) }
			: {}),
		...(localizedFreeTextOption
			? { freeTextOption: localizedFreeTextOption }
			: {}),
		...(config.radioVariant ? { radioVariant: config.radioVariant } : {}),
		...(placeholder ? { placeholder } : {}),
		...(config.allowNullOption !== undefined
			? { allowNullOption: config.allowNullOption }
			: {}),
		...resolveNumberRange(config),
		...(localizedLikertMatrix ? { likertMatrix: localizedLikertMatrix } : {}),
		...(config.condition
			? {
					condition: (formData: Record<string, unknown>) =>
						matchesCondition(config.condition!, formData),
				}
			: {}),
	} as Exclude<FormWrapperFieldConfig, { type: "section" }>;
}

export function buildQuestionnaireStepFormConfig(params: {
	questions: Question[];
	locale?: QuestionnaireLocale;
	initialValues?: Record<string, unknown>;
	onChange: (data: Record<string, unknown>) => void;
	onSubmit: (data: Record<string, unknown>) => void;
	onCancel: () => void;
	submitLabel: string;
	cancelLabel: string;
	submitDisabled?: boolean;
}): FormWrapperConfig {
	const {
		questions,
		locale = "de",
		initialValues,
		onChange,
		onSubmit,
		onCancel,
		submitLabel,
		cancelLabel,
		submitDisabled,
	} = params;

	const formData = initialValues ?? {};
	let visibleQuestionNumber = 0;

	return {
		fields: questions.map((question) => {
			const field = buildFieldConfigFromQuestion(question, locale);
			if (field.type === "checkbox") return field;
			if (getQuestionConfig(question).hideNumber) return field;
			if (!isQuestionVisible(question, formData)) return field;
			visibleQuestionNumber += 1;
			return { ...field, label: `${visibleQuestionNumber}. ${field.label}` };
		}),
		initialValues,
		onChange,
		onSubmit,
		onCancel,
		submitLabel,
		cancelLabel,
		showCancel: true,
		...(submitDisabled !== undefined ? { submitDisabled } : {}),
	};
}

const isFreeTextOptionSelected = (
	fieldType: string,
	rawValue: unknown,
	freeTextOption: NonNullable<QuestionConfig["freeTextOption"]>,
): boolean => {
	if (fieldType === "radio") {
		return String(rawValue) === String(freeTextOption.value);
	}
	if (fieldType === "multiselect" && Array.isArray(rawValue)) {
		return rawValue.some((v) => String(v) === String(freeTextOption.value));
	}
	return false;
};

const isEmptyAnswerValue = (value: unknown): boolean => {
	if (value === undefined || value === null || value === "") return true;
	if (Array.isArray(value)) return value.length === 0;
	if (value && typeof value === "object") {
		return Object.values(value as Record<string, unknown>).every(
			isEmptyAnswerValue,
		);
	}
	return false;
};

export function buildAnswerRowsFromDraft(
	questions: Question[],
	draft: Record<string, unknown>,
): { questionId: number; value: Prisma.InputJsonValue }[] {
	const rows: { questionId: number; value: Prisma.InputJsonValue }[] = [];

	questions.forEach((question) => {
		const config = getQuestionConfig(question);
		if (config.condition && !matchesCondition(config.condition, draft)) {
			return;
		}

		const draftValue = draft[question.key];
		const rawValue =
			question.field_type === "multiselect" && !Array.isArray(draftValue)
				? [draftValue]
				: draftValue;
		if (isEmptyAnswerValue(draftValue)) {
			return;
		}

		const freeTextOption = config.freeTextOption;
		if (
			freeTextOption &&
			isFreeTextOptionSelected(question.field_type, rawValue, freeTextOption)
		) {
			const freeTextFieldName =
				freeTextOption.fieldName ?? `${question.key}FreeText`;
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
