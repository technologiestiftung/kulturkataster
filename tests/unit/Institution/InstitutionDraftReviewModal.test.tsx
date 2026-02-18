import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InstitutionDraftReviewModal } from "@/components/Institution/InstitutionDraftReviewModal";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

const closeModalMock = vi.fn();
const handleReviewMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ??
			(
				{
					"institutionFormModal.review.actions.approve": "Genehmigen",
					"institutionFormModal.review.actions.reject": "Ablehnen",
				} as Record<string, string>
			)[key] ??
			key,
	}),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/Institution/InstitutionReview", () => ({
	InstitutionReview: () => <div>InstitutionReview</div>,
}));

vi.mock("@/components/Modals/useRoutedModalClose", () => ({
	useRoutedModalClose: () => closeModalMock,
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: {
			submissions: unknown[];
			institutionPermissions: {
				create: boolean;
				update: boolean;
				delete: boolean;
				createSubmission: boolean;
				reviewSubmission: boolean;
			};
			upsertSubmission: (s: unknown) => void;
			removeSubmission: (id: number) => void;
		}) => unknown,
	) =>
		selector({
			submissions: [],
			institutionPermissions: {
				create: true,
				update: true,
				delete: true,
				createSubmission: true,
				reviewSubmission: true,
			},
			upsertSubmission: vi.fn(),
			removeSubmission: vi.fn(),
		}),
}));

vi.mock("@/lib/hooks/useInstitutionSubmissionReview", () => ({
	useInstitutionSubmissionReview: () => ({
		hasSubmissionId: true,
		resolvedSubmissionWithFallback: {
			id: 11,
			status: "approval_pending",
			type: "update",
			data: { name: "Draft Name" },
		},
		didFetchSubmission: true,
		originalInstitution: null,
		internalNotes: "",
		setInternalNotes: vi.fn(),
		grantSubmitterAccess: false,
		setGrantSubmitterAccess: vi.fn(),
		submitting: false,
		error: null,
		handleReview: handleReviewMock,
		shouldShowGrantSubmitterAccessToggle: false,
		canReviewCurrentSubmission: true,
	}),
}));

vi.mock("@/lib/utils/feedbackToast", () => ({
	showSuccessToast: vi.fn(),
}));

const mockedShowSuccessToast = vi.mocked(showSuccessToast);

describe("InstitutionDraftReviewModal", () => {
	beforeEach(() => {
		closeModalMock.mockReset();
		handleReviewMock.mockReset();
		handleReviewMock.mockResolvedValue(true);
		refreshMock.mockReset();
		mockedShowSuccessToast.mockReset();
	});

	it("allows approving a submission", async () => {
		render(
			<InstitutionDraftReviewModal
				submissionId={11}
				routePath="/account/submissions/11"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Genehmigen" }));

		await waitFor(() => {
			expect(handleReviewMock).toHaveBeenCalledWith("approved");
		});
		expect(closeModalMock).toHaveBeenCalledTimes(1);
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
	});

	it("allows rejecting a submission", async () => {
		render(
			<InstitutionDraftReviewModal
				submissionId={11}
				routePath="/account/submissions/11"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Ablehnen" }));

		await waitFor(() => {
			expect(handleReviewMock).toHaveBeenCalledWith("rejected");
		});
		expect(closeModalMock).toHaveBeenCalledTimes(1);
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
	});
});
