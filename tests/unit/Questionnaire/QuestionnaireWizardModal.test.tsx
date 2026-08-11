/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QuestionnaireWizardModal } from "@/components/Questionnaire/QuestionnaireWizardModal";
import { submitQuestionnaireAnswers } from "@/server/actions/questionnaires";
import { searchInstitutions } from "@/server/actions/institutions";
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

vi.mock("@/components/HorizontalStepper", () => ({
	HorizontalStepper: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	StepIndicator: () => <div>step-indicator</div>,
	useHorizontalStepper: () => mockStepperState,
}));

let lastFormConfig: {
	fields?: Array<Record<string, unknown>>;
	onSubmit?: (data: Record<string, unknown>) => void;
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
}));

vi.mock("@/server/actions/institutions", () => ({
	searchInstitutions: vi.fn(),
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
		mockFormSubmitData = {};
		vi.mocked(submitQuestionnaireAnswers).mockReset();
		vi.mocked(searchInstitutions).mockReset();
	});

	it("keeps the consent CTA disabled until the checkbox is checked", () => {
		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				profile={null}
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
				profile={null}
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

	it("shows guidance and keeps Weiter disabled when the institution is not registered", () => {
		mockStepperState.currentStepId = "institution-link";

		render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				profile={null}
			/>,
		);

		fireEvent.click(screen.getByLabelText("Nein"));

		expect(
			screen.getByText(/Bitte erfassen Sie den Kulturort/),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Weiter" })).toBeDisabled();
	});

	it("submits collected answers on the review step and shows the thank-you screen", async () => {
		mockStepperState.currentStepId = "block-1";
		vi.mocked(submitQuestionnaireAnswers).mockResolvedValue({ ok: true });

		const { rerender } = render(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				profile={null}
			/>,
		);
		// ensureQuestionnaire() runs on mount and resets the draft for a "new"
		// questionnaireId, so institutionId must be set after mounting.
		useQuestionnaireDraftStore.getState().setInstitutionId(5);

		expect(lastFormConfig?.fields).toEqual([
			expect.objectContaining({ name: "q1", type: "text" }),
		]);

		mockFormSubmitData = { q1: "my answer" };
		fireEvent.click(screen.getByText("mock-form-submit"));
		expect(mockStepperState.nextStep).toHaveBeenCalled();
		expect(useQuestionnaireDraftStore.getState().answers.q1).toBe("my answer");

		mockStepperState.currentStepId = "review";
		rerender(
			<QuestionnaireWizardModal
				routePath="/questionnaire"
				questionnaire={buildQuestionnaire() as any}
				profile={null}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Absenden" }));

		await screen.findByText("Vielen Dank für Ihre Teilnahme!");
		expect(submitQuestionnaireAnswers).toHaveBeenCalledWith({
			questionnaireId: 1,
			institutionId: 5,
			answers: [{ questionId: 10, value: "my answer" }],
		});
	});
});
