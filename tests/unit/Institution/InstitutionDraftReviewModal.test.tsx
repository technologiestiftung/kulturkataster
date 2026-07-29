import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InstitutionDraftReviewModal } from "@/components/Institution/InstitutionDraftReviewModal";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

const closeModalMock = vi.fn();
const handleReviewMock = vi.fn();
const handleSaveNoteMock = vi.fn();
const setInternalNotesMock = vi.fn();
const refreshMock = vi.fn();
const pushMock = vi.fn();
const institutionReviewMock = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (
			key: string,
			options?: {
				defaultValue?: string;
				author?: string;
				date?: string;
			},
		) => {
			const normalizedKey = key.replace(/^content\./, "");
			return (
				options?.defaultValue ??
				{
					"institutionFormModal.review.actions.approve": "Genehmigen",
					"institutionFormModal.review.actions.reject": "Ablehnen",
					"institutionFormModal.review.actions.saveNotes": "Notizen speichern",
					"institutionFormModal.review.notifySubmitter":
						"Einreichende Person per E-Mail über die Entscheidung informieren.",
					"institutionFormModal.review.previousNotesLabel": "Bisherige Notizen",
					"institutionFormModal.review.noteMeta":
						`${options?.author ?? ""} am ${options?.date ?? ""}`.trim(),
				}[normalizedKey] ??
				normalizedKey
			);
		},
		i18n: { language: "de" },
	}),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: refreshMock, push: pushMock }),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/Institution/InstitutionReview", () => ({
	InstitutionReview: (props: {
		onEditSection?: (sectionId: string) => void;
	}) => {
		institutionReviewMock(props);
		return (
			<button type="button" onClick={() => props.onEditSection?.("details")}>
				InstitutionReview
			</button>
		);
	},
}));

vi.mock("@/components/Modals/useRoutedModalClose", () => ({
	useRoutedModalClose: () => closeModalMock,
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: {
			submissions: unknown[];
			users: unknown[];
			groups: unknown[];
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
			users: [],
			groups: [],
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
			notes: [
				{
					id: 1,
					note: "Vorherige Prüfnotiz",
					created_at: "2026-03-25T10:00:00.000Z",
					creator: {
						first_name: "Max",
						last_name: "Mustermann",
						email: "max@example.com",
					},
				},
			],
		},
		didFetchSubmission: true,
		originalInstitution: null,
		internalNotes: "Neue Prüfnotiz",
		setInternalNotes: setInternalNotesMock,
		grantSubmitterAccess: false,
		setGrantSubmitterAccess: vi.fn(),
		submitting: false,
		error: null,
		handleReview: handleReviewMock,
		handleSaveNote: handleSaveNoteMock,
		shouldShowGrantSubmitterAccessToggle: false,
		canReviewCurrentSubmission: true,
	}),
}));

vi.mock("@/components/Account/AccountAutoRefresh", () => ({
	triggerAccountRefresh: vi.fn(),
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
		handleSaveNoteMock.mockReset();
		handleSaveNoteMock.mockResolvedValue(true);
		setInternalNotesMock.mockReset();
		refreshMock.mockReset();
		pushMock.mockReset();
		institutionReviewMock.mockReset();
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
			expect(handleReviewMock).toHaveBeenCalledWith("approved", {
				notifySubmitter: true,
			});
		});
		expect(closeModalMock).toHaveBeenCalledTimes(1);
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
	});

	it("allows approving without emailing the submitter", async () => {
		render(
			<InstitutionDraftReviewModal
				submissionId={11}
				routePath="/account/submissions/11"
			/>,
		);

		fireEvent.click(
			screen.getByRole("checkbox", {
				name: "Einreichende Person per E-Mail über die Entscheidung informieren.",
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: "Genehmigen" }));

		await waitFor(() => {
			expect(handleReviewMock).toHaveBeenCalledWith("approved", {
				notifySubmitter: false,
			});
		});
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
			expect(handleReviewMock).toHaveBeenCalledWith("rejected", {
				notifySubmitter: true,
			});
		});
		expect(closeModalMock).toHaveBeenCalledTimes(1);
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
	});

	it("shows previous notes and allows saving notes without closing", async () => {
		render(
			<InstitutionDraftReviewModal
				submissionId={11}
				routePath="/account/submissions/11"
			/>,
		);

		expect(screen.getByText("Bisherige Notizen")).toBeInTheDocument();
		expect(screen.getByText("Vorherige Prüfnotiz")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Save notes" }),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Save notes" }));

		await waitFor(() => {
			expect(handleSaveNoteMock).toHaveBeenCalledTimes(1);
		});
		expect(closeModalMock).not.toHaveBeenCalled();
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
	});

	it("routes to section edit modal from review for submission 343", async () => {
		render(
			<InstitutionDraftReviewModal
				submissionId={343}
				routePath="/account/submissions/343"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "InstitutionReview" }));

		await waitFor(() => {
			expect(pushMock).toHaveBeenCalledWith(
				"/de/account/submissions/343/edit#details",
			);
		});
	});
});
