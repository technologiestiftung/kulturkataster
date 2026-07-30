import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CategorySubmissionReviewModal } from "@/components/Institution/CategorySubmissionReviewModal";
import {
	reviewSubmission,
	saveSubmissionNote,
} from "@/server/actions/submissions";
import type { Submission } from "@/types/submission";

const replaceMock = vi.fn();
const refreshMock = vi.fn();
const pushMock = vi.fn();
const removeSubmissionMock = vi.fn();
const upsertSubmissionMock = vi.fn();
const triggerAccountRefreshMock = vi.hoisted(() => vi.fn());

let mockSubmissions: Submission[] = [];
let mockInstitutionPermissions = {
	create: true,
	update: true,
	reviewSubmission: true,
	delete: false,
	publish: false,
};

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string; id?: number }) =>
			options?.defaultValue ?? key,
	}),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: pushMock,
		refresh: refreshMock,
		replace: replaceMock,
	}),
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("@/components/Account/AccountAutoRefresh", () => ({
	triggerAccountRefresh: triggerAccountRefreshMock,
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: {
			submissions: Submission[];
			removeSubmission: (id: number) => void;
			upsertSubmission: (submission: Submission) => void;
			institutionPermissions: typeof mockInstitutionPermissions;
		}) => unknown,
	) =>
		selector({
			submissions: mockSubmissions,
			removeSubmission: removeSubmissionMock,
			upsertSubmission: upsertSubmissionMock,
			institutionPermissions: mockInstitutionPermissions,
		}),
}));

vi.mock("@/server/actions/submissions", () => ({
	reviewSubmission: vi.fn(),
	saveSubmissionNote: vi.fn(),
}));

const mockedReviewSubmission = vi.mocked(reviewSubmission);
const mockedSaveSubmissionNote = vi.mocked(saveSubmissionNote);

const buildSubmission = (overrides: Partial<Submission> = {}) =>
	({
		id: 21,
		entity_type: "category",
		type: "create",
		data: { key: "music" },
		meta: { institutionSubmissionId: 44 },
		created_by: "guest@example.de",
		creator: {
			id: "user-1",
			email: "guest@example.de",
			first_name: "E2E",
			last_name: "User",
		},
		notes: [],
		...overrides,
	}) as Submission;

describe("CategorySubmissionReviewModal", () => {
	beforeEach(() => {
		mockSubmissions = [
			buildSubmission({
				id: 44,
				entity_type: "institution",
				data: { name: "Haus der Kultur" },
				meta: null,
			}),
		];
		mockInstitutionPermissions = {
			create: true,
			update: true,
			reviewSubmission: true,
			delete: false,
			publish: false,
		};
		replaceMock.mockReset();
		refreshMock.mockReset();
		pushMock.mockReset();
		removeSubmissionMock.mockReset();
		upsertSubmissionMock.mockReset();
		triggerAccountRefreshMock.mockReset();
		mockedReviewSubmission.mockReset();
		mockedSaveSubmissionNote.mockReset();
	});

	it("renders requester and linked submission in one panel", () => {
		render(<CategorySubmissionReviewModal submission={buildSubmission()} />);

		expect(screen.getByText("E2E User (guest@example.de)")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Haus der Kultur" }),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Haus der Kultur" }));

		expect(pushMock).toHaveBeenCalledWith("/de/account/submissions/44");
	});

	it("saves notes without reviewing the submission", async () => {
		mockedSaveSubmissionNote.mockResolvedValue(buildSubmission() as never);

		render(<CategorySubmissionReviewModal submission={buildSubmission()} />);

		fireEvent.change(screen.getByRole("textbox"), {
			target: { value: "Needs taxonomy check" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Notizen speichern" }));

		await waitFor(() => {
			expect(mockedSaveSubmissionNote).toHaveBeenCalledWith({
				submissionId: 21,
				note: "Needs taxonomy check",
			});
		});
		expect(mockedReviewSubmission).not.toHaveBeenCalled();
	});

	it("reviews category submissions from the footer actions", async () => {
		mockedReviewSubmission.mockResolvedValue({
			id: 21,
			status: "approved",
		} as never);

		render(<CategorySubmissionReviewModal submission={buildSubmission()} />);

		fireEvent.click(screen.getByRole("button", { name: "Annehmen" }));

		await waitFor(() => {
			expect(mockedReviewSubmission).toHaveBeenCalledWith({
				id: 21,
				status: "approved",
				internalNotes: "",
			});
		});
		expect(removeSubmissionMock).toHaveBeenCalledWith(21);
		expect(replaceMock).toHaveBeenCalledWith("/de/account/institutions");
	});
});
