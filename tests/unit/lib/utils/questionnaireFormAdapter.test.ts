import { describe, expect, it, vi } from "vitest";
import type { Question } from "@/generated/prisma";
import {
	buildAnswerRowsFromDraft,
	buildFieldConfigFromQuestion,
	buildQuestionnaireStepFormConfig,
	filterQuestionsForInstitutionStatus,
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

	it("resolves the English title/description when locale is 'en'", () => {
		const questionnaire = {
			meta_data: {
				blocks: {
					"1": {
						title: "Block A: Standort und Vertragsdimension",
						title_en: "Block A: Location and Contract Dimension",
						description: "Fragen zur Raumsituation.",
						description_en: "Questions about the space situation.",
					},
				},
			},
		};

		expect(getBlockMeta(questionnaire, 1, "en")).toEqual({
			title: "Block A: Location and Contract Dimension",
			description: "Questions about the space situation.",
		});
	});

	it("falls back to German when locale is 'en' but no translation was seeded", () => {
		const questionnaire = {
			meta_data: { blocks: { "1": { title: "Nur Deutsch" } } },
		};

		expect(getBlockMeta(questionnaire, 1, "en")).toEqual({
			title: "Nur Deutsch",
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
			placeholder: "Bitte eintragen",
		});
	});

	it("falls back to the generic placeholder for text/textarea questions without their own", () => {
		const textQuestion = asQuestion({
			...baseQuestion,
			key: "notes",
			label: "Anmerkungen",
			field_type: "text",
			required: false,
			step: 1,
			order: 0,
		});
		const radioQuestion = asQuestion({
			...baseQuestion,
			key: "room_usage",
			label: "Wie nutzt Ihre Einrichtung die Räume?",
			field_type: "radio",
			required: false,
			step: 1,
			order: 1,
			config: { options: [{ value: "a", label: "A" }] },
		});

		expect(buildFieldConfigFromQuestion(textQuestion).placeholder).toBe(
			"Bitte eintragen",
		);
		expect(buildFieldConfigFromQuestion(textQuestion, "en").placeholder).toBe(
			"Please enter",
		);
		expect(
			buildFieldConfigFromQuestion(radioQuestion).placeholder,
		).toBeUndefined();
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

	it("maps a multiselect question with options", () => {
		const question = asQuestion({
			...baseQuestion,
			key: "channels",
			label: "Digitale Kanäle",
			field_type: "multiselect",
			required: false,
			step: 1,
			order: 0,
			config: {
				options: [
					{ value: "website", label: "eigene Webseite" },
					{ value: "newsletter", label: "E-Mail-Newsletter" },
				],
			},
		});

		const result = buildFieldConfigFromQuestion(question);
		expect(result.type).toBe("multiselect");
		expect(result.options).toEqual([
			{ value: "website", label: "eigene Webseite" },
			{ value: "newsletter", label: "E-Mail-Newsletter" },
		]);
	});

	it("maps a likertMatrix question with shared options and rows", () => {
		const question = asQuestion({
			...baseQuestion,
			key: "funding_importance",
			label: "Bedeutung Ihrer Finanzierungsquellen",
			field_type: "likertMatrix",
			required: false,
			step: 4,
			order: 0,
			config: {
				options: [
					{ value: "5", label: "hohe Bedeutung" },
					{ value: "1", label: "keine Bedeutung" },
				],
				likertMatrix: {
					rows: [
						{ key: "public_funding", label: "öffentliche Förderung" },
						{ key: "donations", label: "Spenden" },
					],
				},
			},
		});

		const result = buildFieldConfigFromQuestion(question);
		expect(result.type).toBe("likertMatrix");
		expect(result.options).toHaveLength(2);
		expect((result as { likertMatrix?: unknown }).likertMatrix).toEqual({
			rows: [
				{ key: "public_funding", label: "öffentliche Förderung" },
				{ key: "donations", label: "Spenden" },
			],
		});
	});

	it("translates a condition config into a working condition predicate", () => {
		const question = asQuestion({
			...baseQuestion,
			key: "notice_period",
			label: "Kündigungsfrist",
			field_type: "radio",
			required: false,
			step: 2,
			order: 1,
			config: {
				options: [
					{ value: "yes", label: "Ja" },
					{ value: "no", label: "Nein" },
				],
				condition: { dependsOnKey: "room_usage", equals: "rent_regular" },
			},
		});

		const result = buildFieldConfigFromQuestion(question);
		expect(result.condition).toBeInstanceOf(Function);
		expect(result.condition?.({ room_usage: "rent_regular" })).toBe(true);
		expect(result.condition?.({ room_usage: "ownership" })).toBe(false);
	});

	it("supports a condition with a list of equals values", () => {
		const question = asQuestion({
			...baseQuestion,
			key: "notice_period",
			label: "Kündigungsfrist",
			field_type: "radio",
			required: false,
			step: 2,
			order: 1,
			config: {
				options: [],
				condition: {
					dependsOnKey: "room_usage",
					equals: ["rent_regular", "rent_sublet"],
				},
			},
		});

		const result = buildFieldConfigFromQuestion(question);
		expect(result.condition?.({ room_usage: "rent_sublet" })).toBe(true);
		expect(result.condition?.({ room_usage: "ownership" })).toBe(false);
	});

	it("resolves label/description/options in English when locale is 'en'", () => {
		const question = asQuestion({
			...baseQuestion,
			key: "room_usage",
			label: "Wie nutzt Ihre Einrichtung die Räume?",
			label_en: "How does your institution use the rooms?",
			description: "Bitte auswählen",
			description_en: "Please select",
			field_type: "radio",
			required: true,
			step: 1,
			order: 0,
			config: {
				options: [
					{ value: "ownership", label: "Eigentum", label_en: "Ownership" },
					{ value: "other", label: "Sonstiges", label_en: "Other" },
				],
				freeTextOption: {
					value: "other",
					placeholder: "Bitte angeben",
					placeholder_en: "Please specify",
				},
			},
		});

		const result = buildFieldConfigFromQuestion(question, "en");
		expect(result.label).toBe("How does your institution use the rooms?");
		expect(result.description).toBe("Please select");
		expect(result.options).toEqual([
			{ value: "ownership", label: "Ownership" },
			{ value: "other", label: "Other" },
		]);
		expect(result.freeTextOption?.placeholder).toBe("Please specify");
	});

	it("resolves the general field placeholder in English when locale is 'en'", () => {
		const question = asQuestion({
			...baseQuestion,
			key: "since_founded_year",
			label: "Seit wann besteht die Einrichtung insgesamt?",
			field_type: "text",
			required: false,
			step: 1,
			order: 0,
			config: {
				placeholder: "z.B. 2015",
				placeholder_en: "e.g. 2015",
			},
		});

		const result = buildFieldConfigFromQuestion(question, "en");
		expect(result.placeholder).toBe("e.g. 2015");
	});

	it("falls back to German fields when locale is 'en' but no _en value was seeded", () => {
		const question = asQuestion({
			...baseQuestion,
			key: "since_founded_year",
			label: "Seit wann besteht die Einrichtung insgesamt?",
			field_type: "text",
			required: false,
			step: 1,
			order: 0,
		});

		const result = buildFieldConfigFromQuestion(question, "en");
		expect(result.label).toBe("Seit wann besteht die Einrichtung insgesamt?");
	});

	it("resolves likertMatrix row labels in English when locale is 'en'", () => {
		const question = asQuestion({
			...baseQuestion,
			key: "funding_importance",
			label: "Bedeutung Ihrer Finanzierungsquellen",
			field_type: "likertMatrix",
			required: false,
			step: 4,
			order: 0,
			config: {
				options: [
					{ value: "5", label: "hohe Bedeutung", label_en: "high importance" },
				],
				likertMatrix: {
					rows: [
						{
							key: "public_funding",
							label: "öffentliche Förderung",
							label_en: "public funding",
						},
					],
				},
			},
		});

		const result = buildFieldConfigFromQuestion(question, "en");
		expect(
			(result as { likertMatrix?: { rows: { label: string }[] } }).likertMatrix
				?.rows[0].label,
		).toBe("public funding");
		expect(result.options?.[0]).toEqual({
			value: "5",
			label: "high importance",
		});
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

	it("numbers each question within the step, restarting at 1 per call", () => {
		const questions = [
			asQuestion({
				...baseQuestion,
				id: 1,
				key: "q1",
				label: "First question",
				field_type: "text",
				step: 1,
				order: 0,
			}),
			asQuestion({
				...baseQuestion,
				id: 2,
				key: "q2",
				label: "Second question",
				field_type: "text",
				step: 1,
				order: 1,
			}),
			asQuestion({
				...baseQuestion,
				id: 3,
				key: "q3",
				label: "Third question",
				field_type: "text",
				step: 1,
				order: 2,
			}),
		];

		const config = buildQuestionnaireStepFormConfig({
			questions,
			onChange: vi.fn(),
			onSubmit: vi.fn(),
			onCancel: vi.fn(),
			submitLabel: "Weiter",
			cancelLabel: "Zurück",
		});

		expect(
			config.fields?.map((f) => (f.type === "section" ? undefined : f.label)),
		).toEqual(["1. First question", "2. Second question", "3. Third question"]);

		const nextStepConfig = buildQuestionnaireStepFormConfig({
			questions: [
				asQuestion({
					...baseQuestion,
					id: 4,
					key: "q4",
					label: "Next step's first question",
					field_type: "text",
					step: 2,
					order: 0,
				}),
			],
			onChange: vi.fn(),
			onSubmit: vi.fn(),
			onCancel: vi.fn(),
			submitLabel: "Weiter",
			cancelLabel: "Zurück",
		});

		expect(nextStepConfig.fields?.[0]).toMatchObject({
			label: "1. Next step's first question",
		});
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

	it("folds a multiselect freeTextOption companion when the option is checked", () => {
		const questions = [
			asQuestion({
				...baseQuestion,
				id: 1,
				key: "channels",
				label: "Channels",
				field_type: "multiselect",
				required: false,
				step: 1,
				order: 0,
				config: {
					options: [
						{ value: "website", label: "eigene Webseite" },
						{ value: "other", label: "Sonstige" },
					],
					freeTextOption: { value: "other", fieldName: "channelsFreeText" },
				},
			}),
		];

		const rows = buildAnswerRowsFromDraft(questions, {
			channels: ["website", "other"],
			channelsFreeText: "Podcast",
		});

		expect(rows).toEqual([
			{
				questionId: 1,
				value: { selected: ["website", "other"], freeText: "Podcast" },
			},
		]);
	});

	it("does not fold multiselect freeText when the free-text option isn't checked", () => {
		const questions = [
			asQuestion({
				...baseQuestion,
				id: 1,
				key: "channels",
				label: "Channels",
				field_type: "multiselect",
				required: false,
				step: 1,
				order: 0,
				config: {
					options: [
						{ value: "website", label: "eigene Webseite" },
						{ value: "other", label: "Sonstige" },
					],
					freeTextOption: { value: "other", fieldName: "channelsFreeText" },
				},
			}),
		];

		const rows = buildAnswerRowsFromDraft(questions, {
			channels: ["website"],
			channelsFreeText: "should be ignored",
		});

		expect(rows).toEqual([{ questionId: 1, value: ["website"] }]);
	});

	it("skips an empty likertMatrix answer", () => {
		const questions = [
			asQuestion({
				...baseQuestion,
				id: 1,
				key: "funding_importance",
				label: "Funding importance",
				field_type: "likertMatrix",
				required: true,
				step: 1,
				order: 0,
				config: {
					options: [{ value: "5", label: "hohe Bedeutung" }],
					likertMatrix: {
						rows: [{ key: "public_funding", label: "öffentliche Förderung" }],
					},
				},
			}),
		];

		expect(
			buildAnswerRowsFromDraft(questions, { funding_importance: {} }),
		).toEqual([]);
	});

	it("keeps a partially answered likertMatrix answer for non-submit serialization callers", () => {
		const questions = [
			asQuestion({
				...baseQuestion,
				id: 1,
				key: "funding_importance",
				label: "Funding importance",
				field_type: "likertMatrix",
				required: false,
				step: 1,
				order: 0,
				config: {
					options: [{ value: "5", label: "hohe Bedeutung" }],
					likertMatrix: {
						rows: [
							{ key: "public_funding", label: "öffentliche Förderung" },
							{ key: "donations", label: "Spenden" },
						],
					},
				},
			}),
		];

		expect(
			buildAnswerRowsFromDraft(questions, {
				funding_importance: { public_funding: "5" },
			}),
		).toEqual([{ questionId: 1, value: { public_funding: "5" } }]);
	});

	it("skips a stale answer for a question whose condition no longer holds", () => {
		const questions = [
			asQuestion({
				...baseQuestion,
				id: 1,
				key: "room_usage",
				label: "Room usage",
				field_type: "radio",
				required: true,
				step: 2,
				order: 0,
				config: { options: [] },
			}),
			asQuestion({
				...baseQuestion,
				id: 2,
				key: "notice_period",
				label: "Notice period",
				field_type: "radio",
				required: false,
				step: 2,
				order: 1,
				config: {
					options: [],
					condition: { dependsOnKey: "room_usage", equals: "rent_regular" },
				},
			}),
		];

		const rows = buildAnswerRowsFromDraft(questions, {
			room_usage: "ownership",
			notice_period: "under_3_months",
		});

		expect(rows).toEqual([{ questionId: 1, value: "ownership" }]);
	});
});

describe("filterQuestionsForInstitutionStatus", () => {
	it("removes onlyWhenNotRegistered questions when the institution is already registered", () => {
		const questions = [
			asQuestion({
				...baseQuestion,
				id: 1,
				key: "category_selection",
				label: "Kategorie",
				field_type: "multiselect",
				step: 1,
				order: 0,
				config: { options: [], onlyWhenNotRegistered: true },
			}),
			asQuestion({
				...baseQuestion,
				id: 2,
				key: "since_location_year",
				label: "Seit wann am Standort?",
				field_type: "text",
				step: 1,
				order: 1,
			}),
		];

		expect(filterQuestionsForInstitutionStatus(questions, true)).toEqual([
			questions[1],
		]);
	});

	it("keeps onlyWhenNotRegistered questions when the institution is not yet registered", () => {
		const questions = [
			asQuestion({
				...baseQuestion,
				id: 1,
				key: "category_selection",
				label: "Kategorie",
				field_type: "multiselect",
				step: 1,
				order: 0,
				config: { options: [], onlyWhenNotRegistered: true },
			}),
		];

		expect(filterQuestionsForInstitutionStatus(questions, false)).toEqual(
			questions,
		);
	});
});
