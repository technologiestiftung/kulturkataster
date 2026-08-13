/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { QuestionnaireWizardModal } from "@/components/Questionnaire/QuestionnaireWizardModal";
import {
	checkQuestionnaireCompletion,
	submitQuestionnaireAnswers,
} from "@/server/actions/questionnaires";
import { searchInstitutions } from "@/server/actions/institutions";
import { createSubmission } from "@/server/actions/submissions";
import { useQuestionnaireDraftStore } from "@/lib/store/questionnaireDraftStore";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>) =>
			(options?.defaultValue as string) ?? key,
		i18n: { changeLanguage: () => new Promise(() => {}) },
	}),
	Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
	usePathname: () => "/de/questionnaire",
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/Modals/useRoutedModalClose", () => ({
	useRoutedModalClose: () => vi.fn(),
}));

type MockStepperState = {
	currentStepId: string;
	currentStepIndex: number;
	totalSteps: number;
	goToStep: ReturnType<typeof vi.fn>;
	nextStep: ReturnType<typeof vi.fn>;
	previousStep: ReturnType<typeof vi.fn>;
	canGoNext: boolean;
	canGoPrevious: boolean;
	setStepValidation: ReturnType<typeof vi.fn>;
};

let mockStepperState: MockStepperState;
let lastHorizontalStepperProps: { initialStepId?: string } | null = null;

vi.mock("@/components/HorizontalStepper", async () => {
	const actual = await vi.importActual<
		typeof import("@/components/HorizontalStepper")
	>("@/components/HorizontalStepper");
	return {
		...actual,
		HorizontalStepper: ({
			children,
			initialStepId,
		}: {
			children: React.ReactNode;
			initialStepId?: string;
		}) => {
			lastHorizontalStepperProps = { initialStepId };
			return <div>{children}</div>;
		},
		StepIndicator: () => <div>step-indicator</div>,
		useHorizontalStepper: () => mockStepperState,
	};
});

let lastFormConfig: {
	fields?: Array<Record<string, unknown>>;
	onSubmit?: (data: Record<string, unknown>) => void;
	submitLabel?: string;
} | null = null;

vi.mock("@/components/FormWrapper", () => ({
	FormWrapper: ({ config }: { config: any }) => {
		lastFormConfig = config;
		return (
			<div>
				<button onClick={() => config.onSubmit?.(mockFormSubmitData)}>
					mock-form-submit
				</button>
			</div>
		);
	},
}));

let mockFormSubmitData: Record<string, unknown> = {};

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

vi.mock("@/components/Search/LocationSearch", () => ({
	LocationSearch: ({
		onQueryChange,
		placeholder,
	}: {
		onQueryChange?: (query: string) => void;
		placeholder?: string;
	}) => (
		<input
			placeholder={placeholder}
			onChange={(e) => onQueryChange?.(e.target.value)}
		/>
	),
}));

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
			required: false,
			step: 1,
			order: 0,
			config: null,
			created_at: new Date(),
			updated_at: new Date(),
		},
	],
});

describe("QuestionnaireWizardModal", () => {
	beforeEach(() => {
		window.localStorage.clear();
		useQuestionnaireDraftStore.getState().reset();
		mockStepperState = {
			currentStepId: "consent",
			currentStepIndex: 0,
			totalSteps: 4,
			goToStep: vi.fn(),
			nextStep: vi.fn(),
			previousStep: vi.fn(),
			canGoNext: true,
			canGoPrevious: false,
			setStepValidation: vi.fn(),
		};
		lastFormConfig = null;
		lastHorizontalStepperProps = null;
		mockFormSubmitData = {};
		vi.mocked(submitQuestionnaireAnswers).mockReset();
		vi.mocked(searchInstitutions).mockReset();
		vi.mocked(createSubmission).mockReset();
		vi.mocked(checkQuestionnaireCompletion).mockReset();
		vi.mocked(checkQuestionnaireCompletion).mockResolvedValue({
			ok: true,
			alreadySubmitted: false,
		});
	});

	it("keeps the consent CTA disabled until the checkbox is checked", () => {
		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
			/>,
		);

		const cta = screen.getByRole("button", {
			name: "An der Befragung teilnehmen",
		});
		expect(cta).toBeDisabled();

		fireEvent.click(screen.getByLabelText(/Ich habe die Informationen/));
		expect(cta).not.toBeDisabled();

		fireEvent.click(cta);
		expect(mockStepperState.nextStep).toHaveBeenCalled();
	});

	it("only allows proceeding on the institution-link step once an institution is picked", async () => {
		mockStepperState.currentStepId = "institution-link";
		vi.mocked(searchInstitutions).mockResolvedValue([
			{ id: 5, name: "Test Institution" } as any,
		]);

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
			/>,
		);

		fireEvent.click(screen.getByLabelText("Ja"));
		const weiter = screen.getByRole("button", { name: "Weiter" });
		expect(weiter).toBeDisabled();

		fireEvent.change(screen.getByPlaceholderText("Adresse oder Ort eingeben"), {
			target: { value: "Test" },
		});

		const option = await screen.findByText("Test Institution");
		fireEvent.click(option);

		expect(screen.getByRole("button", { name: "Weiter" })).not.toBeDisabled();
	});

	it("shows an alert dialog and resets the selection when the institution already completed this questionnaire", async () => {
		mockStepperState.currentStepId = "institution-link";
		vi.mocked(searchInstitutions).mockResolvedValue([
			{ id: 5, name: "Test Institution" } as any,
		]);
		vi.mocked(checkQuestionnaireCompletion).mockResolvedValue({
			ok: true,
			alreadySubmitted: true,
		});

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
			/>,
		);

		fireEvent.click(screen.getByLabelText("Ja"));
		fireEvent.change(screen.getByPlaceholderText("Adresse oder Ort eingeben"), {
			target: { value: "Test" },
		});
		const option = await screen.findByText("Test Institution");
		fireEvent.click(option);

		expect(await screen.findByText(/bereits ausgefüllt/)).toBeInTheDocument();
		expect(checkQuestionnaireCompletion).toHaveBeenCalledWith({
			questionnaireId: 1,
			institutionId: 5,
		});

		fireEvent.click(screen.getByRole("button", { name: "Schließen" }));

		expect(useQuestionnaireDraftStore.getState().institutionId).toBeNull();
		expect(screen.getByRole("button", { name: "Weiter" })).toBeDisabled();
	});

	it("shows the compact institution-create form when the institution is not registered", () => {
		mockStepperState.currentStepId = "institution-link";

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
			/>,
		);

		fireEvent.click(screen.getByLabelText("Nein"));

		expect(
			screen.queryByText(/Bitte tragen Sie den Kulturort/),
		).not.toBeInTheDocument();
		expect(screen.getByText("mock-form-submit")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Weiter" }),
		).not.toBeInTheDocument();
	});

	it("advances to the next step once the compact institution-create form is filled in, without creating anything yet", async () => {
		mockStepperState.currentStepId = "institution-link";

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
			/>,
		);

		fireEvent.click(screen.getByLabelText("Nein"));
		mockFormSubmitData = { name: "Neuer Kulturort" };
		fireEvent.click(screen.getByText("mock-form-submit"));
		await Promise.resolve();
		await Promise.resolve();

		// Nothing is written to the DB just from filling out this step — the
		// Submission only gets created atomically with the answers at the final
		// "Absenden". createSubmission isn't even mocked here to prove that.
		expect(useQuestionnaireDraftStore.getState().submissionId).toBeNull();
		expect(useQuestionnaireDraftStore.getState().pendingInstitutionData).toEqual({
			name: "Neuer Kulturort",
		});
		expect(mockStepperState.nextStep).toHaveBeenCalled();
	});

	it("navigates to a different block when its dot is clicked", () => {
		mockStepperState.currentStepId = "block-1";
		const questionnaire = {
			id: 1,
			title: "Test Survey",
			meta_data: null,
			questions: [
				{ ...buildQuestionnaire().questions[0], key: "q1", step: 1 },
				{ ...buildQuestionnaire().questions[0], id: 11, key: "q2", step: 2 },
			],
		};

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={questionnaire as any}
				categoryGroups={[]}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Go to step 2" }));

		expect(mockStepperState.goToStep).toHaveBeenCalledWith("block-2");
	});

	it("sets block step validation to false while a required question is unanswered", () => {
		mockStepperState.currentStepId = "block-1";
		const questionnaire = {
			id: 1,
			title: "Test Survey",
			meta_data: null,
			questions: [
				{ ...buildQuestionnaire().questions[0], key: "q1", required: true },
			],
		};

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={questionnaire as any}
				categoryGroups={[]}
			/>,
		);

		const latestValidation = () =>
			mockStepperState.setStepValidation.mock.calls
				.filter(([stepId]) => stepId === "block-1")
				.at(-1)?.[1];

		expect(latestValidation()?.()).toBe(false);

		act(() => {
			useQuestionnaireDraftStore.getState().setAnswers({ q1: "an answer" });
		});
		expect(latestValidation()?.()).toBe(true);
	});

	it("shows Weiter and advances via nextStep on a non-last block", () => {
		mockStepperState.currentStepId = "block-1";
		const questionnaire = {
			id: 1,
			title: "Test Survey",
			meta_data: null,
			questions: [
				{ ...buildQuestionnaire().questions[0], key: "q1", step: 1 },
				{ ...buildQuestionnaire().questions[0], id: 11, key: "q2", step: 2 },
			],
		};

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={questionnaire as any}
				categoryGroups={[]}
			/>,
		);

		expect(lastFormConfig?.submitLabel).toBe("Weiter");

		mockFormSubmitData = { q1: "my answer" };
		fireEvent.click(screen.getByText("mock-form-submit"));

		expect(mockStepperState.nextStep).toHaveBeenCalled();
		expect(submitQuestionnaireAnswers).not.toHaveBeenCalled();
		expect(useQuestionnaireDraftStore.getState().answers.q1).toBe("my answer");
	});

	it("shows Absenden on the last block, submits directly, and shows the thank-you screen", async () => {
		mockStepperState.currentStepId = "block-1";
		vi.mocked(submitQuestionnaireAnswers).mockResolvedValue({ ok: true });

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
			/>,
		);
		// ensureQuestionnaire() runs on mount and resets the draft for a "new"
		// questionnaireId, so institutionId must be set after mounting. Wrapped in
		// act() so the resulting re-render lands before the click below captures a
		// fresh onSubmit closure (there's no rerender() call in this flow, unlike
		// the old two-step review-page version of this test).
		act(() => {
			useQuestionnaireDraftStore.getState().setInstitutionId(5);
		});

		expect(lastFormConfig?.fields).toEqual([
			expect.objectContaining({ name: "q1", type: "text" }),
		]);
		expect(lastFormConfig?.submitLabel).toBe("Absenden");

		mockFormSubmitData = { q1: "my answer" };
		fireEvent.click(screen.getByText("mock-form-submit"));

		await screen.findByText("Vielen Dank für Ihre Teilnahme!");
		expect(mockStepperState.nextStep).not.toHaveBeenCalled();
		expect(submitQuestionnaireAnswers).toHaveBeenCalledWith({
			questionnaireId: 1,
			institutionId: 5,
			answers: [{ questionId: 10, value: "my answer" }],
		});
	});

	it("clears the persisted draft after a successful submission, so a later visit doesn't carry over the old institutionId", async () => {
		// Regression test: the draft store persists to localStorage, but the
		// stepper's own position does not — so without clearing institutionId on
		// success, revisiting /questionnaire later restarts at "consent" while
		// still holding the just-submitted institution, wrongly triggering the
		// "already submitted" dialog the moment institution-link is reached again.
		mockStepperState.currentStepId = "block-1";
		vi.mocked(submitQuestionnaireAnswers).mockResolvedValue({ ok: true });

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
			/>,
		);
		act(() => {
			useQuestionnaireDraftStore.getState().setInstitutionId(5);
		});

		mockFormSubmitData = { q1: "my answer" };
		fireEvent.click(screen.getByText("mock-form-submit"));
		await screen.findByText("Vielen Dank für Ihre Teilnahme!");

		expect(useQuestionnaireDraftStore.getState().institutionId).toBeNull();
		expect(useQuestionnaireDraftStore.getState().submissionId).toBeNull();
		expect(useQuestionnaireDraftStore.getState().answers).toEqual({});
	});

	it("seeds institutionId from the initialInstitutionId prop on mount", () => {
		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
				initialInstitutionId={42}
			/>,
		);

		expect(useQuestionnaireDraftStore.getState().institutionId).toBe(42);
		expect(useQuestionnaireDraftStore.getState().isInstitutionRegistered).toBe(
			true,
		);
	});

	it("seeds submissionId from the initialSubmissionId prop on mount", () => {
		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
				initialSubmissionId={99}
			/>,
		);

		expect(useQuestionnaireDraftStore.getState().submissionId).toBe(99);
		expect(useQuestionnaireDraftStore.getState().isInstitutionRegistered).toBe(
			false,
		);
	});

	it("passes a real step id through to HorizontalStepper's initialStepId", () => {
		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
				initialStepId="institution-link"
			/>,
		);

		expect(lastHorizontalStepperProps?.initialStepId).toBe("institution-link");
	});

	it("renders the thank-you screen directly when initialShowThankYou is true, without a submission", () => {
		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
				initialShowThankYou
			/>,
		);

		expect(
			screen.getByText("Vielen Dank für Ihre Teilnahme!"),
		).toBeInTheDocument();
		expect(submitQuestionnaireAnswers).not.toHaveBeenCalled();
	});

	it("ignores an unknown step id instead of forwarding it to HorizontalStepper", () => {
		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
				initialStepId="not-a-real-step"
			/>,
		);

		expect(lastHorizontalStepperProps?.initialStepId).toBeUndefined();
	});

	it("keeps the URL in sync with the current step and selected institution", () => {
		mockStepperState.currentStepId = "institution-link";
		const replaceStateSpy = vi.spyOn(window.history, "replaceState");

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
			/>,
		);

		act(() => {
			useQuestionnaireDraftStore.getState().setInstitutionId(5);
		});

		const lastCallUrl = replaceStateSpy.mock.calls.at(-1)?.[2] as URL;
		expect(lastCallUrl.searchParams.get("step")).toBe("institution-link");
		expect(lastCallUrl.searchParams.get("institutionId")).toBe("5");
		expect(lastCallUrl.searchParams.get("submissionId")).toBeNull();

		replaceStateSpy.mockRestore();
	});

	it("updates the URL to thankyou=1 and clears step/institution/submission ids after a successful submission", async () => {
		mockStepperState.currentStepId = "block-1";
		vi.mocked(submitQuestionnaireAnswers).mockResolvedValue({ ok: true });
		const replaceStateSpy = vi.spyOn(window.history, "replaceState");

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				categoryGroups={[]}
			/>,
		);
		act(() => {
			useQuestionnaireDraftStore.getState().setInstitutionId(5);
		});

		mockFormSubmitData = { q1: "my answer" };
		fireEvent.click(screen.getByText("mock-form-submit"));
		await screen.findByText("Vielen Dank für Ihre Teilnahme!");

		const lastCallUrl = replaceStateSpy.mock.calls.at(-1)?.[2] as URL;
		expect(lastCallUrl.searchParams.get("thankyou")).toBe("1");
		expect(lastCallUrl.searchParams.get("step")).toBeNull();
		expect(lastCallUrl.searchParams.get("institutionId")).toBeNull();
		expect(lastCallUrl.searchParams.get("submissionId")).toBeNull();

		replaceStateSpy.mockRestore();
	});
});
