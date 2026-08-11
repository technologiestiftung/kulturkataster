import { describe, expect, it, vi } from "vitest";
import type { Question } from "@/generated/prisma";
import {
	buildAnswerRowsFromDraft,
	buildFieldConfigFromQuestion,
	buildQuestionnaireStepFormConfig,
	getBlockMeta,
	groupQuestionsByStep,
} from "@/lib/utils/questionnaireFormAdapter";

const baseQuestion = {
	id: 1,
	questionnaire_id: 10,
	description: null,
	required: false,
	config: null,
	created_at: new Date(),
	updated_at: new Date(),
} satisfies Partial<Question>;

const asQuestion = (value: Partial<Question>) => value as unknown as Question;

describe("getBlockMeta", () => {
	it("reads title/description from meta_data.blocks keyed by step", () => {
		const questionnaire = {
			meta_data: {
				blocks: {
					"1": {
						title: "Block A: Standort und Vertragsdimension",
						description: "Fragen zur Raumsituation.",
					},
				},
			},
		};

		expect(getBlockMeta(questionnaire, 1)).toEqual({
			title: "Block A: Standort und Vertragsdimension",
			description: "Fragen zur Raumsituation.",
		});
	});

	it("falls back to a generic label when unseeded", () => {
		expect(getBlockMeta({ meta_data: null }, 3)).toEqual({
			title: "Themenblock 3",
			description: undefined,
		});
		expect(getBlockMeta({}, 3)).toEqual({
			title: "Themenblock 3",
			description: undefined,
		});
	});
});

describe("groupQuestionsByStep", () => {
	it("groups already-ordered questions by step, preserving first-seen step order", () => {
		const questions = [
			asQuestion({ ...baseQuestion, id: 1, step: 1, order: 0, key: "q1" }),
			asQuestion({ ...baseQuestion, id: 2, step: 1, order: 1, key: "q2" }),
			asQuestion({ ...baseQuestion, id: 3, step: 2, order: 0, key: "q3" }),
		];

		const groups = groupQuestionsByStep(questions);

		expect(groups).toEqual([
			{ step: 1, questions: [questions[0], questions[1]] },
			{ step: 2, questions: [questions[2]] },
		]);
	});

	it("returns an empty array for no questions", () => {
		expect(groupQuestionsByStep([])).toEqual([]);
	});
});

describe("buildFieldConfigFromQuestion", () => {
	it("maps a text question", () => {
		const question = asQuestion({
			...baseQuestion,
			key: "notes",
			label: "Anmerkungen",
			field_type: "text",
			required: true,
			step: 1,
			order: 0,
		});

		expect(buildFieldConfigFromQuestion(question)).toEqual({
			name: "notes",
			label: "Anmerkungen",
			description: undefined,
			type: "text",
			required: true,
		});
	});

	it("maps a radio question with options and a freeTextOption", () => {
		const question = asQuestion({
			...baseQuestion,
			key: "usage",
			label: "Wie nutzt Ihre Einrichtung die Räume?",
			description: "Bitte auswählen",
			field_type: "radio",
			required: true,
			step: 1,
			order: 1,
			config: {
				options: [
					{ value: "ownership", label: "Eigentum" },
					{ value: "other", label: "Sonstiges" },
				],
				freeTextOption: {
					value: "other",
					fieldName: "usageFreeText",
					placeholder: "Bitte angeben",
				},
			},
		});

		expect(buildFieldConfigFromQuestion(question)).toEqual({
			name: "usage",
			label: "Wie nutzt Ihre Einrichtung die Räume?",
			description: "Bitte auswählen",
			type: "radio",
			required: true,
			options: [
				{ value: "ownership", label: "Eigentum" },
				{ value: "other", label: "Sonstiges" },
			],
			freeTextOption: {
				value: "other",
				fieldName: "usageFreeText",
				placeholder: "Bitte angeben",
			},
		});
	});

	it("maps a likert question with endpoint-only labeled options", () => {
		const question = asQuestion({
			...baseQuestion,
			key: "stability",
			label: "Wie stabil ist das Mietverhältnis?",
			field_type: "likert",
			required: false,
			step: 1,
			order: 2,
			config: {
				options: [
					{ value: "1", label: "sehr instabil" },
					{ value: "2", label: "" },
					{ value: "3", label: "teils/teils" },
					{ value: "4", label: "" },
					{ value: "5", label: "sehr stabil" },
				],
			},
		});

		const result = buildFieldConfigFromQuestion(question);
		expect(result.type).toBe("likert");
		expect(result.options).toHaveLength(5);
		expect(result.options?.[0]).toEqual({ value: "1", label: "sehr instabil" });
	});

	it("falls back to text and warns for an unsupported field_type", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const question = asQuestion({
			...baseQuestion,
			key: "mystery",
			label: "Unknown field",
			field_type: "file",
			required: false,
			step: 1,
			order: 0,
		});

		const result = buildFieldConfigFromQuestion(question);

		expect(result.type).toBe("text");
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining("questionnaire.unsupported_field_type"),
			expect.objectContaining({ field_type: "file", key: "mystery" }),
		);
		warnSpy.mockRestore();
	});

	it("passes through radioVariant, placeholder, and allowNullOption from config", () => {
		const question = asQuestion({
			...baseQuestion,
			key: "eviction",
			label: "Liegt eine Kündigung vor?",
			field_type: "radio",
			required: false,
			step: 1,
			order: 3,
			config: {
				options: [
					{ value: "yes", label: "Ja" },
					{ value: "no", label: "Nein" },
				],
				radioVariant: "button",
				placeholder: "Bitte wählen",
				allowNullOption: true,
			},
		});

		const result = buildFieldConfigFromQuestion(question);
		expect(result.radioVariant).toBe("button");
		expect(result.placeholder).toBe("Bitte wählen");
		expect(result.allowNullOption).toBe(true);
	});
});

describe("buildQuestionnaireStepFormConfig", () => {
	it("builds a flat FormWrapperConfig from a step's questions", () => {
		const questions = [
			asQuestion({
				...baseQuestion,
				id: 1,
				key: "q1",
				label: "Q1",
				field_type: "text",
				step: 1,
				order: 0,
			}),
			asQuestion({
				...baseQuestion,
				id: 2,
				key: "q2",
				label: "Q2",
				field_type: "textarea",
				step: 1,
				order: 1,
			}),
		];
		const onSubmit = vi.fn();
		const onChange = vi.fn();
		const onCancel = vi.fn();

		const config = buildQuestionnaireStepFormConfig({
			questions,
			onChange,
			onSubmit,
			onCancel,
			submitLabel: "Weiter",
			cancelLabel: "Zurück",
		});

		expect(config.fields).toHaveLength(2);
		expect(config.fields?.[0]).toMatchObject({ name: "q1", type: "text" });
		expect(config.fields?.[1]).toMatchObject({ name: "q2", type: "textarea" });
		expect(config.onSubmit).toBe(onSubmit);
		expect(config.onChange).toBe(onChange);
		expect(config.onCancel).toBe(onCancel);
		expect(config.submitLabel).toBe("Weiter");
		expect(config.cancelLabel).toBe("Zurück");
		expect(config.showCancel).toBe(true);
	});
});

describe("buildAnswerRowsFromDraft", () => {
	it("skips optional questions left unanswered", () => {
		const questions = [
			asQuestion({
				...baseQuestion,
				id: 1,
				key: "q1",
				label: "Q1",
				field_type: "text",
				required: false,
				step: 1,
				order: 0,
			}),
			asQuestion({
				...baseQuestion,
				id: 2,
				key: "q2",
				label: "Q2",
				field_type: "text",
				required: true,
				step: 1,
				order: 1,
			}),
		];

		const rows = buildAnswerRowsFromDraft(questions, { q2: "answered" });

		expect(rows).toEqual([{ questionId: 2, value: "answered" }]);
	});

	it("folds a radio freeTextOption companion field into the same row's value", () => {
		const questions = [
			asQuestion({
				...baseQuestion,
				id: 1,
				key: "usage",
				label: "Usage",
				field_type: "radio",
				required: true,
				step: 1,
				order: 0,
				config: {
					options: [{ value: "other", label: "Sonstiges" }],
					freeTextOption: { value: "other", fieldName: "usageFreeText" },
				},
			}),
		];

		const rows = buildAnswerRowsFromDraft(questions, {
			usage: "other",
			usageFreeText: "Zwischennutzung",
		});

		expect(rows).toEqual([
			{
				questionId: 1,
				value: { selected: "other", freeText: "Zwischennutzung" },
			},
		]);
	});

	it("does not fold freeText when a different option was selected", () => {
		const questions = [
			asQuestion({
				...baseQuestion,
				id: 1,
				key: "usage",
				label: "Usage",
				field_type: "radio",
				required: true,
				step: 1,
				order: 0,
				config: {
					options: [
						{ value: "ownership", label: "Eigentum" },
						{ value: "other", label: "Sonstiges" },
					],
					freeTextOption: { value: "other", fieldName: "usageFreeText" },
				},
			}),
		];

		const rows = buildAnswerRowsFromDraft(questions, {
			usage: "ownership",
			usageFreeText: "should be ignored",
		});

		expect(rows).toEqual([{ questionId: 1, value: "ownership" }]);
	});
});
