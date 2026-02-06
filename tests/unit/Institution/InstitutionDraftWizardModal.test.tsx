/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InstitutionDraftWizardModal } from "@/components/Institution/InstitutionDraftWizardModal";
import { createSubmission } from "@/server/actions/submissions";
import { useInstitutionDraftStore } from "@/lib/store/institutionDraftStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { buildAddressFromFormData } from "@/lib/utils/formUtils";
import { resolveCategoryIdsFromDraft } from "@/lib/utils/institutionCategoryUtils";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { changeLanguage: () => new Promise(() => {}) },
	}),
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

let mockFormSubmitData: Record<string, unknown> = {};

vi.mock("@/components/FormWrapper", () => ({
	FormWrapper: ({ config }: { config: any }) => (
		<div>
			<button onClick={() => config.onSubmit?.(mockFormSubmitData)}>
				mock-form-submit
			</button>
			<button onClick={() => config.onCancel?.()}>mock-form-cancel</button>
		</div>
	),
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
};

let mockStepperState: MockStepperState;

vi.mock("@/components/HorizontalStepper", () => ({
	HorizontalStepper: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	StepIndicator: () => <div>step-indicator</div>,
	useHorizontalStepper: () => mockStepperState,
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({ content }: { content: React.ReactNode }) => <div>{content}</div>,
}));

vi.mock("@/components/Institution/InstitutionReview", () => ({
	InstitutionReview: () => <div>institution-review</div>,
}));

vi.mock("@/components/Institution/InstitutionFormModal", () => ({
	InstitutionFormModal: () => null,
}));

vi.mock("@/server/actions/submissions", () => ({
	createSubmission: vi.fn(),
}));

vi.mock("@/lib/utils/formUtils", () => ({
	buildAddressFromFormData: vi.fn(() => ({ street: "Mock Street" })),
	handleAddressBlur: () => vi.fn(),
	handleLatLngBlur: () => vi.fn(),
}));

vi.mock("@/lib/utils/institutionCategoryUtils", () => ({
	resolveCategoryIdsFromDraft: vi.fn(() => [101, 202]),
}));

const mockedCreateSubmission = vi.mocked(createSubmission);
const mockedBuildAddressFromFormData = vi.mocked(buildAddressFromFormData);
const mockedResolveCategoryIdsFromDraft = vi.mocked(
	resolveCategoryIdsFromDraft,
);

describe("InstitutionDraftWizardModal submission workflow", () => {
	beforeEach(() => {
		pushMock.mockReset();
		mockedCreateSubmission.mockReset();
		mockedCreateSubmission.mockResolvedValue({} as any);
		mockedBuildAddressFromFormData.mockClear();
		mockedResolveCategoryIdsFromDraft.mockClear();

		mockFormSubmitData = {};
		mockStepperState = {
			currentStepId: "review",
			currentStepIndex: 4,
			totalSteps: 5,
			goToStep: vi.fn(),
			nextStep: vi.fn(),
			previousStep: vi.fn(),
			canGoNext: false,
			canGoPrevious: false,
		};

		const draftState = useInstitutionDraftStore.getState();
		draftState.resetDraft();
		draftState.setStepId("review");
		draftState.setMode("create");
		draftState.setDraft({
			name: "Draft Institution",
			"address.city": "Berlin",
		});

		useInstitutionStore.setState({
			categories: [
				{
					id: 101,
					key: "cat-a",
					label: "Category A",
					parent_category_id: null,
					child_categories: [],
				},
			],
		} as any);
	});

	it("submits create payload from review step and navigates to account institutions", async () => {
		render(<InstitutionDraftWizardModal routePath="/institution/submission" />);

		fireEvent.click(screen.getByRole("button", { name: "Submission senden" }));

		await waitFor(() => {
			expect(mockedCreateSubmission).toHaveBeenCalledTimes(1);
		});

		expect(mockedResolveCategoryIdsFromDraft).toHaveBeenCalled();
		expect(mockedBuildAddressFromFormData).toHaveBeenCalled();
		expect(mockedCreateSubmission).toHaveBeenCalledWith(
			expect.objectContaining({
				entityType: "institution",
				entityId: null,
				type: "create",
				status: "approval_pending",
				data: expect.objectContaining({
					name: "Draft Institution",
					address: { street: "Mock Street" },
					categoryIds: [101, 202],
				}),
			}),
		);
		expect(pushMock).toHaveBeenCalledWith("/de/account/institutions");
	});

	it("submits update payload with entityId and navigates back to institution page", async () => {
		const draftState = useInstitutionDraftStore.getState();
		draftState.setMode("update");
		draftState.setDraft({
			entityId: 55,
			name: "Existing Institution",
		});

		render(<InstitutionDraftWizardModal routePath="/institution/submission" />);

		fireEvent.click(screen.getByRole("button", { name: "Submission senden" }));

		await waitFor(() => {
			expect(mockedCreateSubmission).toHaveBeenCalledTimes(1);
		});

		expect(mockedCreateSubmission).toHaveBeenCalledWith(
			expect.objectContaining({
				entityType: "institution",
				entityId: 55,
				type: "update",
				status: "approval_pending",
			}),
		);
		expect(pushMock).toHaveBeenCalledWith("/de/institution");
	});

	it("advances to next step without submitting when canGoNext is true", async () => {
		mockStepperState.currentStepId = "basic";
		mockStepperState.currentStepIndex = 0;
		mockStepperState.canGoNext = true;
		mockFormSubmitData = { name: "Changed Name" };

		render(<InstitutionDraftWizardModal routePath="/institution/submission" />);

		fireEvent.click(screen.getByRole("button", { name: "mock-form-submit" }));

		await waitFor(() => {
			expect(mockStepperState.nextStep).toHaveBeenCalledTimes(1);
		});
		expect(mockedCreateSubmission).not.toHaveBeenCalled();
	});

	it("submits merged draft + step data when finalizing from a non-review step", async () => {
		mockStepperState.currentStepId = "contact";
		mockStepperState.currentStepIndex = 3;
		mockStepperState.canGoNext = false;

		const draftState = useInstitutionDraftStore.getState();
		draftState.setDraft({
			name: "Draft Name",
			website: "https://draft.example",
		});
		mockFormSubmitData = {
			contact_person_email: "contact@example.com",
		};

		render(<InstitutionDraftWizardModal routePath="/institution/submission" />);

		fireEvent.click(screen.getByRole("button", { name: "mock-form-submit" }));

		await waitFor(() => {
			expect(mockedCreateSubmission).toHaveBeenCalledTimes(1);
		});

		expect(mockedCreateSubmission).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "create",
				data: expect.objectContaining({
					name: "Draft Name",
					website: "https://draft.example",
					contact_person_email: "contact@example.com",
					address: { street: "Mock Street" },
					categoryIds: [101, 202],
				}),
			}),
		);
	});
});
