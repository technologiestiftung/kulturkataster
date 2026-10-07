/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { QuestionnaireWizardModal } from "@/components/Questionnaire/QuestionnaireWizardModal";
import {
	checkQuestionnaireCompletion,
	submitQuestionnaireAnswers,
} from "@/server/actions/questionnaires";
import { createSubmission } from "@/server/actions/submissions";
import { useQuestionnaireDraftStore } from "@/lib/store/questionnaireDraftStore";

// Deliberately does NOT mock @/components/HorizontalStepper — the bug this file
// guards against only exists in the *real* useHorizontalStepper's canProceed
// gating, which QuestionnaireWizardModal.test.tsx's mocked stepper bypasses
// entirely (its nextStep is just a spy, so it can never fail to advance).
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>) =>
			(options?.defaultValue as string) ?? key,
		i18n: { changeLanguage: () => new Promise(() => {}), language: "de" },
	}),
	Trans: () => null,
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/Modals/useRoutedModalClose", () => ({
	useRoutedModalClose: () => vi.fn(),
}));

let lastFormConfig: {
	fields?: Array<{ name: string }>;
	onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
} | null = null;
let mockFormSubmitData: Record<string, unknown> = {};

vi.mock("@/components/FormWrapper", () => ({
	FormWrapper: ({ config }: { config: any }) => {
		lastFormConfig = config;
		return (
			<button onClick={() => config.onSubmit?.(mockFormSubmitData)}>
				mock-form-submit
			</button>
		);
	},
}));

vi.mock("@/server/actions/questionnaires", () => ({
	submitQuestionnaireAnswers: vi.fn(),
	checkQuestionnaireCompletion: vi.fn(),
}));

vi.mock("@/server/actions/institutions", () => ({
	searchInstitutions: vi.fn(),
}));

vi.mock("@/server/actions/submissions", () => ({
	createSubmission: vi.fn(),
}));

vi.mock("@/server/actions/maptiler", () => ({
	geocodeAddress: vi.fn(),
	reverseGeocode: vi.fn(),
}));

const flushMicrotasks = async () => {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
};

const buildQuestionnaire = () => ({
	id: 1,
	title: "Test Survey",
	meta_data: null,
	questions: [
		{
			id: 10,
			questionnaire_id: 1,
			key: "q1",
			label: "Question 1",
			description: null,
			field_type: "text",
			required: true,
			step: 1,
			order: 0,
			config: null,
			created_at: new Date(),
			updated_at: new Date(),
		},
		{
			id: 11,
			questionnaire_id: 1,
			key: "q2",
			label: "Question 2",
			description: null,
			field_type: "text",
			required: true,
			step: 2,
			order: 0,
			config: null,
			created_at: new Date(),
			updated_at: new Date(),
		},
	],
});

describe("QuestionnaireWizardContent step advancement (real stepper)", () => {
	beforeEach(() => {
		window.localStorage.clear();
		useQuestionnaireDraftStore.getState().reset();
		lastFormConfig = null;
		mockFormSubmitData = {};
		vi.mocked(createSubmission).mockReset();
		vi.mocked(submitQuestionnaireAnswers).mockReset();
		vi.mocked(checkQuestionnaireCompletion).mockReset();
		vi.mocked(checkQuestionnaireCompletion).mockResolvedValue({
			ok: true,
			alreadySubmitted: false,
		});
	});

	const advanceThroughConsent = () => {
		fireEvent.click(screen.getByLabelText(/Ich habe die Informationen/));
		fireEvent.click(
			screen.getByRole("button", { name: "An der Befragung teilnehmen" }),
		);
	};

	it("advances past institution-link on the FIRST submit of the compact create form, without writing anything to the DB yet (regression: previously required a second click and created a duplicate submission)", async () => {
		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
			/>,
		);

		advanceThroughConsent();

		fireEvent.click(screen.getByLabelText("Nein"));
		mockFormSubmitData = { name: "Neuer Kulturort" };
		fireEvent.click(screen.getByText("mock-form-submit"));
		await flushMicrotasks();

		// Filling out this form alone must not create anything — the Submission is
		// only created atomically with the answers at the final "Absenden".
		expect(createSubmission).not.toHaveBeenCalled();
		// The rendered form must now be the first block's question form (field "q1"),
		// not the compact institution-create form (fields "basicSection" etc.) still
		// waiting for a second click.
		expect(lastFormConfig?.fields?.map((f) => f.name)).toEqual(["q1"]);
	});

	it("advances past a non-last block on the FIRST submit (regression: same stale-validator race affected block-to-block navigation)", async () => {
		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
			/>,
		);

		advanceThroughConsent();
		fireEvent.click(screen.getByLabelText("Nein"));
		mockFormSubmitData = { name: "Neuer Kulturort" };
		fireEvent.click(screen.getByText("mock-form-submit"));
		await flushMicrotasks();

		// Now on block-1 (field "q1"). Answering it and submitting must move to
		// block-2 (field "q2") immediately, not require a second submit.
		expect(lastFormConfig?.fields?.map((f) => f.name)).toEqual(["q1"]);
		mockFormSubmitData = { q1: "answer one" };
		fireEvent.click(screen.getByText("mock-form-submit"));
		await flushMicrotasks();

		expect(lastFormConfig?.fields?.map((f) => f.name)).toEqual(["q2"]);
		expect(submitQuestionnaireAnswers).not.toHaveBeenCalled();
	});

	it("submits the compact form's data as newInstitution on the final Absenden, not before", async () => {
		vi.mocked(submitQuestionnaireAnswers).mockResolvedValue({ ok: true });

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
			/>,
		);

		advanceThroughConsent();
		fireEvent.click(screen.getByLabelText("Nein"));
		mockFormSubmitData = {
			name: "Neuer Kulturort",
			newCategory: "Archiv",
		};
		fireEvent.click(screen.getByText("mock-form-submit"));
		await flushMicrotasks();

		expect(submitQuestionnaireAnswers).not.toHaveBeenCalled();

		mockFormSubmitData = { q1: "answer one" };
		fireEvent.click(screen.getByText("mock-form-submit"));
		await flushMicrotasks();

		mockFormSubmitData = { q2: "answer two" };
		fireEvent.click(screen.getByText("mock-form-submit"));
		await flushMicrotasks();

		expect(submitQuestionnaireAnswers).toHaveBeenCalledWith(
			expect.objectContaining({
				questionnaireId: 1,
				newInstitution: expect.objectContaining({
					name: "Neuer Kulturort",
					newCategoryKeys: ["Archiv"],
				}),
			}),
		);
	});
	it("blocks a step-dot jump forward when a revisited block's number answer is outside its configured range (regression: range was only enforced by the block's own submit)", async () => {
		const questionnaire = buildQuestionnaire();
		questionnaire.questions[0] = {
			...questionnaire.questions[0],
			key: "founded_year",
			field_type: "number",
			required: false,
			config: { min: 1000, max: 2100 } as any,
		};

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={questionnaire as any}
				categoryGroups={[]}
			/>,
		);

		advanceThroughConsent();
		fireEvent.click(screen.getByLabelText("Nein"));
		mockFormSubmitData = { name: "Neuer Kulturort" };
		fireEvent.click(screen.getByText("mock-form-submit"));
		await flushMicrotasks();

		mockFormSubmitData = { founded_year: "1990" };
		fireEvent.click(screen.getByText("mock-form-submit"));
		await flushMicrotasks();
		expect(lastFormConfig?.fields?.map((f) => f.name)).toEqual(["q2"]);

		fireEvent.click(screen.getByLabelText("Go to step 1"));
		expect(lastFormConfig?.fields?.map((f) => f.name)).toEqual([
			"founded_year",
		]);

		for (const outOfRange of ["99", "3000", "abc"]) {
			act(() => {
				useQuestionnaireDraftStore
					.getState()
					.setAnswers({ founded_year: outOfRange });
			});
			fireEvent.click(screen.getByLabelText("Go to step 2"));
			expect(lastFormConfig?.fields?.map((f) => f.name)).toEqual([
				"founded_year",
			]);
		}

		act(() => {
			useQuestionnaireDraftStore
				.getState()
				.setAnswers({ founded_year: "2000" });
		});
		fireEvent.click(screen.getByLabelText("Go to step 2"));
		expect(lastFormConfig?.fields?.map((f) => f.name)).toEqual(["q2"]);
	});
});
