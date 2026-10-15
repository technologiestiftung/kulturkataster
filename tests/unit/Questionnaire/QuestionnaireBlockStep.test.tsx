import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QuestionnaireBlockStep } from "@/components/Questionnaire/QuestionnaireBlockStep";
import type { Question } from "@/generated/prisma";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>) =>
			(options?.defaultValue as string) ?? key,
		i18n: { changeLanguage: () => new Promise(() => {}), language: "de" },
	}),
	Trans: () => null,
}));

const buildQuestion = (id: number, key: string, step: number): Question => ({
	id,
	questionnaire_id: 1,
	key,
	label: `Question ${key}`,
	label_en: null,
	description: null,
	description_en: null,
	field_type: "text",
	required: true,
	step,
	order: 0,
	config: null,
	created_at: new Date(),
	updated_at: new Date(),
});

const questionsByStep: Record<number, Question[]> = {
	1: [buildQuestion(10, "q1", 1)],
	2: [buildQuestion(11, "q2", 2)],
};

const renderBlock = (step: number, initialValues: Record<string, unknown>) => (
	<QuestionnaireBlockStep
		questionnaire={{ meta_data: null }}
		step={step}
		questions={questionsByStep[step]}
		locale="de"
		blockIndex={step - 1}
		totalBlocks={2}
		blockStepIds={["block-1", "block-2"]}
		onNavigateToStep={vi.fn()}
		initialValues={initialValues}
		onChange={vi.fn()}
		onSubmit={vi.fn()}
		onBack={vi.fn()}
		nextLabel="Weiter"
		backLabel="Zurück"
	/>
);

describe("QuestionnaireBlockStep", () => {
	it("does not carry a failed submit over to another block", () => {
		const { rerender } = render(renderBlock(1, {}));
		fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
		expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");

		rerender(renderBlock(2, {}));
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "x" } });
		fireEvent.change(input, { target: { value: "" } });

		expect(input).not.toHaveAttribute("aria-invalid");
	});

	it("shows the stored answers when navigating back to a block", () => {
		const { rerender } = render(renderBlock(1, {}));
		rerender(renderBlock(2, { q1: "Antwort" }));
		rerender(renderBlock(1, { q1: "Antwort" }));

		expect(screen.getByRole("textbox")).toHaveValue("Antwort");
	});
});
