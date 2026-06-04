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
import type { InstitutionStoreState } from "@/types/institution";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) =>
			({
				"enumMap.field_names.owner_type.options.none": "Keine Angabe",
				"enumMap.field_names.shared_use_allowed.options.none": "Keine Angabe",
			})[key] ?? key.replace(/^content\./, ""),
		i18n: { changeLanguage: () => new Promise(() => {}) },
	}),
}));

const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

let mockFormSubmitData: Record<string, unknown> = {};
let lastFormConfig: { fields?: Array<Record<string, unknown>> } | null = null;

const findFieldByName = (
	fields: Array<Record<string, unknown>> | undefined,
	name: string,
): Record<string, unknown> | undefined => {
	if (!fields) return undefined;
	for (const field of fields) {
		if (field.name === name) return field;
		const nested = Array.isArray(field.fields)
			? findFieldByName(field.fields as Array<Record<string, unknown>>, name)
			: undefined;
		if (nested) return nested;
	}
	return undefined;
};

vi.mock("@/components/FormWrapper", () => ({
	FormWrapper: ({ config }: { config: any }) => {
		lastFormConfig = config;
		return (
			<div>
				<button onClick={() => config.onSubmit?.(mockFormSubmitData)}>
					mock-form-submit
				</button>
				<button onClick={() => config.onCancel?.()}>mock-form-cancel</button>
			</div>
		);
	},
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
const institutionReviewMock = vi.fn();
vi.mock("@/components/Modals/useRoutedModalClose", () => ({
	useRoutedModalClose: () => closeModalMock,
}));

vi.mock("@/lib/utils/feedbackToast", () => ({
	showSuccessToast: vi.fn(),
}));

vi.mock("@/components/Institution/InstitutionReview", () => ({
	InstitutionReview: (props: Record<string, unknown>) => {
		institutionReviewMock(props);
		return <div>institution-review</div>;
	},
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
	const setInstitutionStoreState = (state: Partial<InstitutionStoreState>) =>
		useInstitutionStore.setState(state);

	beforeEach(() => {
		pushMock.mockReset();
		replaceMock.mockReset();
		closeModalMock.mockReset();
		institutionReviewMock.mockReset();
		mockedCreateSubmission.mockReset();
		mockedCreateSubmission.mockResolvedValue({} as any);
		mockedBuildAddressFromFormData.mockClear();
		mockedResolveCategoryIdsFromDraft.mockClear();
		mockedShowSuccessToast.mockReset();

		mockFormSubmitData = {};
		lastFormConfig = null;
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

		setInstitutionStoreState({
			initializePublicData: vi.fn(),
			categories: [
				{
					id: 101,
					key: "cat-a",
					label: "Category A",
					parent_category_id: null,
					child_categories: [],
				},
			],
			allInstitutions: [],
		});
	});

	it("submits create payload from review step and routes to institution thank-you", async () => {
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
		expect(replaceMock).toHaveBeenCalledWith("/de/institution?thankyou=1");
		expect(closeModalMock).not.toHaveBeenCalled();
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
			}),
		);
		expect(mockedCreateSubmission.mock.calls[1]?.[0]).toEqual(
			expect.objectContaining({
				entityType: "category",
				entityId: null,
				type: "create",
				data: { key: "Atelier" },
			}),
		);
		expect(mockedCreateSubmission.mock.calls[2]?.[0]).toEqual(
			expect.objectContaining({
				entityType: "category",
				entityId: null,
				type: "create",
				data: { key: "Probe" },
			}),
		);
	});

	it("submits update payload with entityId and routes to institution thank-you", async () => {
		const draftState = useInstitutionDraftStore.getState();
		draftState.setMode("update");
		draftState.setDraft({
			entityId: 55,
			name: "Updated Institution Name",
			website: "https://unchanged.example",
			originalInstitution: {
				id: 55,
				name: "Original Institution Name",
				website: "https://unchanged.example",
				address: {
					street: "Old Street",
					street_number: "2",
					city: "Berlin",
				},
			},
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
				diff: expect.objectContaining({
					name: "Updated Institution Name",
				}),
			}),
		);
		expect(replaceMock).toHaveBeenCalledWith("/de/institution?thankyou=1");
		expect(closeModalMock).not.toHaveBeenCalled();
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
		expect(mockedShowSuccessToast).toHaveBeenCalledWith(
			"institutionDraftWizardModal.feedback.submit.title",
			"institutionDraftWizardModal.feedback.submit.description",
		);
	});

	it("passes original and updated values to review overview in update mode", () => {
		const draftState = useInstitutionDraftStore.getState();
		draftState.setMode("update");
		draftState.setDraft({
			entityId: 55,
			name: "Updated Name",
			originalInstitution: {
				id: 55,
				name: "Original Name",
				status: "public",
			},
		});

		render(<InstitutionDraftWizardModal routePath="/institution/submission" />);

		expect(institutionReviewMock).toHaveBeenCalled();
		const lastCall = institutionReviewMock.mock.calls.at(-1)?.[0] as
			| { data?: Record<string, unknown>; newData?: Record<string, unknown> }
			| undefined;
		expect(lastCall?.data).toEqual(
			expect.objectContaining({ name: "Original Name" }),
		);
		expect(lastCall?.newData).toEqual(
			expect.objectContaining({ name: "Updated Name" }),
		);
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

	it("does not pre-fill contact fields with profile data when consent_contact_listing is not set", () => {
		mockStepperState.currentStepId = "contact";
		mockStepperState.currentStepIndex = 3;

		const draftState = useInstitutionDraftStore.getState();
		draftState.setDraft({ name: "Draft Name" });

		render(
			<InstitutionDraftWizardModal
				routePath="/institution/submission"
				profile={
					{
						first_name: "Anna",
						last_name: "Beispiel",
						email: "anna@example.com",
						phone: "+49 30 123",
					} as any
				}
			/>,
		);

		const firstNameField = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"contact_person_first_name",
		);
		const emailField = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"contact_person_email",
		);

		expect(firstNameField?.defaultValue).toBe("");
		expect(emailField?.defaultValue).toBe("");
	});

	it("pre-fills contact fields with profile data when consent_contact_listing is true", () => {
		mockStepperState.currentStepId = "contact";
		mockStepperState.currentStepIndex = 3;

		const draftState = useInstitutionDraftStore.getState();
		draftState.setDraft({
			name: "Draft Name",
			consent_contact_listing: true,
		});

		render(
			<InstitutionDraftWizardModal
				routePath="/institution/submission"
				profile={
					{
						first_name: "Anna",
						last_name: "Beispiel",
						email: "anna@example.com",
						phone: "+49 30 123",
					} as any
				}
			/>,
		);

		const firstNameField = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"contact_person_first_name",
		);
		const lastNameField = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"contact_person_last_name",
		);
		const emailField = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"contact_person_email",
		);
		const phoneField = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"contact_person_phone",
		);

		expect(firstNameField?.defaultValue).toBe("Anna");
		expect(lastNameField?.defaultValue).toBe("Beispiel");
		expect(emailField?.defaultValue).toBe("anna@example.com");
		expect(phoneField?.defaultValue).toBe("+49 30 123");
	});

	it("includes protection status internal notes in the information step form config", () => {
		mockStepperState.currentStepId = "information";
		mockStepperState.currentStepIndex = 2;

		render(<InstitutionDraftWizardModal routePath="/institution/submission" />);

		const field = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"protection_status_internal_notes",
		);

		expect(field).toEqual(
			expect.objectContaining({
				name: "protection_status_internal_notes",
				type: "textarea",
			}),
		);
	});

	it("allows clearing owner type through the select null option", () => {
		mockStepperState.currentStepId = "information";
		mockStepperState.currentStepIndex = 2;

		render(<InstitutionDraftWizardModal routePath="/institution/submission" />);

		const field = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"owner_type",
		);

		expect(field).toMatchObject({
			type: "select",
			allowNullOption: true,
			nullOptionLabel: "Keine Angabe",
		});
	});

	it("allows clearing shared use allowed through the radio null option", () => {
		mockStepperState.currentStepId = "information";
		mockStepperState.currentStepIndex = 2;

		render(<InstitutionDraftWizardModal routePath="/institution/submission" />);

		const field = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"shared_use_allowed",
		);

		expect(field).toMatchObject({
			type: "radio",
			allowNullOption: true,
			nullOptionLabel: "Keine Angabe",
		});
	});
});
