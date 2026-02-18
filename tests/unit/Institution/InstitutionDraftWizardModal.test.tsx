/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InstitutionDraftWizardModal } from "@/components/Institution/InstitutionDraftWizardModal";
import { createSubmission } from "@/server/actions/submissions";
import { useInstitutionDraftStore } from "@/lib/store/institutionDraftStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { buildAddressFromFormData } from "@/lib/utils/formUtils";
import { resolveCategoryIdsFromDraft } from "@/lib/utils/institutionCategoryUtils";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

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

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const closeModalMock = vi.fn();
vi.mock("@/components/Modals/useRoutedModalClose", () => ({
	useRoutedModalClose: () => closeModalMock,
}));

vi.mock("@/lib/utils/feedbackToast", () => ({
	showSuccessToast: vi.fn(),
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
const mockedShowSuccessToast = vi.mocked(showSuccessToast);

describe("InstitutionDraftWizardModal submission workflow", () => {
	beforeEach(() => {
		pushMock.mockReset();
		closeModalMock.mockReset();
		mockedCreateSubmission.mockReset();
		mockedCreateSubmission.mockResolvedValue({} as any);
		mockedBuildAddressFromFormData.mockClear();
		mockedResolveCategoryIdsFromDraft.mockClear();
		mockedShowSuccessToast.mockReset();

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
			setStepValidation: vi.fn(),
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

		fireEvent.click(
			screen.getByRole("button", {
				name: "institutionDraftWizardModal.actions.submit",
			}),
		);

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
		expect(mockedCreateSubmission.mock.calls[0]?.[0]).not.toEqual(
			expect.objectContaining({
				data: expect.objectContaining({ newCategory: expect.anything() }),
			}),
		);
		expect(closeModalMock).toHaveBeenCalledTimes(1);
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
	});

	it("creates separate category submissions for proposed new categories", async () => {
		const draftState = useInstitutionDraftStore.getState();
		draftState.setDraft({
			name: "Draft With New Category",
			newCategory: "Atelier,  Probe , Atelier,",
		});

		mockedCreateSubmission
			.mockResolvedValueOnce({ id: 321 } as any)
			.mockResolvedValue({} as any);

		render(<InstitutionDraftWizardModal routePath="/institution/submission" />);

		fireEvent.click(
			screen.getByRole("button", {
				name: "institutionDraftWizardModal.actions.submit",
			}),
		);

		await waitFor(() => {
			expect(mockedCreateSubmission).toHaveBeenCalledTimes(3);
		});

		expect(mockedCreateSubmission.mock.calls[0]?.[0]).toEqual(
			expect.objectContaining({
				entityType: "institution",
				type: "create",
				status: "approval_pending",
			}),
		);
		expect(mockedCreateSubmission.mock.calls[1]?.[0]).toEqual(
			expect.objectContaining({
				entityType: "category",
				entityId: null,
				type: "create",
				status: "approval_pending",
				data: { key: "Atelier" },
			}),
		);
		expect(mockedCreateSubmission.mock.calls[2]?.[0]).toEqual(
			expect.objectContaining({
				entityType: "category",
				entityId: null,
				type: "create",
				status: "approval_pending",
				data: { key: "Probe" },
			}),
		);
	});

	it("submits update payload with entityId and navigates back to institution page", async () => {
		const draftState = useInstitutionDraftStore.getState();
		draftState.setMode("update");
		draftState.setDraft({
			entityId: 55,
			name: "Existing Institution",
		});

		render(<InstitutionDraftWizardModal routePath="/institution/submission" />);

		fireEvent.click(
			screen.getByRole("button", {
				name: "institutionDraftWizardModal.actions.submit",
			}),
		);

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
		expect(closeModalMock).toHaveBeenCalledTimes(1);
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
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

	it("moves to next step from non-review submit without creating submission", async () => {
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
			expect(mockStepperState.nextStep).toHaveBeenCalledTimes(1);
		});

		expect(mockedCreateSubmission).not.toHaveBeenCalled();
	});

	it("registers step validation and blocks progression for missing required name", async () => {
		mockStepperState.currentStepId = "basic";
		mockStepperState.currentStepIndex = 0;
		mockStepperState.canGoNext = true;

		const draftState = useInstitutionDraftStore.getState();
		draftState.setDraft({
			name: "",
			"address.city": "Berlin",
		});

		render(<InstitutionDraftWizardModal routePath="/institution/submission" />);

		await waitFor(() => {
			expect(mockStepperState.setStepValidation).toHaveBeenCalledWith(
				"basic",
				expect.any(Function),
			);
		});

		const validationFn = mockStepperState.setStepValidation.mock.calls.find(
			([stepId]) => stepId === "basic",
		)?.[1] as (() => boolean) | undefined;

		expect(validationFn).toBeDefined();
		expect(validationFn?.()).toBe(false);
	});

	it("allows progression when required basic fields are present", async () => {
		mockStepperState.currentStepId = "basic";
		mockStepperState.currentStepIndex = 0;
		mockStepperState.canGoNext = true;

		const draftState = useInstitutionDraftStore.getState();
		draftState.setDraft({
			name: "Valid Name",
			"address.city": "Berlin",
		});

		render(<InstitutionDraftWizardModal routePath="/institution/submission" />);

		await waitFor(() => {
			expect(mockStepperState.setStepValidation).toHaveBeenCalledWith(
				"basic",
				expect.any(Function),
			);
		});

		const validationFn = mockStepperState.setStepValidation.mock.calls.find(
			([stepId]) => stepId === "basic",
		)?.[1] as (() => boolean) | undefined;

		expect(validationFn).toBeDefined();
		expect(validationFn?.()).toBe(true);
	});
});
