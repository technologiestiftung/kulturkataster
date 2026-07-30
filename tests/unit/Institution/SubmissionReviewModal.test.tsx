import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SubmissionReviewModal } from "@/components/Institution/SubmissionReviewModal";
import { getSubmissionById } from "@/server/actions/submissions";

let mockSubmissions: Array<Record<string, unknown>> = [];
const institutionReviewMock = vi.fn();
const categoryReviewMock = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ?? key,
	}),
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({
		children,
		loadingState,
	}: {
		children?: React.ReactNode;
		loadingState?: { active?: boolean; label?: string };
	}) => (
		<div>
			{loadingState?.active ? <div>{loadingState.label}</div> : null}
			{children}
		</div>
	),
}));

vi.mock("@/components/Institution/InstitutionDraftReviewModal", () => ({
	InstitutionDraftReviewModal: (props: unknown) => {
		institutionReviewMock(props);
		return <div>institution-review</div>;
	},
}));

vi.mock("@/components/Institution/CategorySubmissionReviewModal", () => ({
	CategorySubmissionReviewModal: (props: unknown) => {
		categoryReviewMock(props);
		return <div>category-review</div>;
	},
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: {
			submissions: Array<Record<string, unknown>>;
		}) => unknown,
	) => selector({ submissions: mockSubmissions }),
}));

vi.mock("@/server/actions/submissions", () => ({
	getSubmissionById: vi.fn(),
}));

const mockedGetSubmissionById = vi.mocked(getSubmissionById);

describe("SubmissionReviewModal", () => {
	beforeEach(() => {
		mockSubmissions = [];
		institutionReviewMock.mockReset();
		categoryReviewMock.mockReset();
		mockedGetSubmissionById.mockReset();
	});

	it("keeps a loading modal mounted until the submission type is known", async () => {
		mockedGetSubmissionById.mockResolvedValue({
			id: 7,
			entity_type: "category",
		} as never);

		render(
			<SubmissionReviewModal
				submissionId={7}
				routePath="/account/submissions/7"
			/>,
		);

		expect(screen.getByText("Einreichung wird geladen...")).toBeInTheDocument();
		expect(institutionReviewMock).not.toHaveBeenCalled();
		expect(categoryReviewMock).not.toHaveBeenCalled();

		await waitFor(() => {
			expect(screen.getByText("category-review")).toBeInTheDocument();
		});
		expect(institutionReviewMock).not.toHaveBeenCalled();
		expect(categoryReviewMock).toHaveBeenCalledTimes(1);
	});

	it("renders institution review directly when an institution submission is already available", () => {
		mockSubmissions = [
			{
				id: 9,
				entity_type: "institution",
			},
		];

		render(
			<SubmissionReviewModal
				submissionId={9}
				routePath="/account/submissions/9"
			/>,
		);

		expect(screen.getByText("institution-review")).toBeInTheDocument();
		expect(institutionReviewMock).toHaveBeenCalled();
		expect(categoryReviewMock).not.toHaveBeenCalled();
	});

	it("keeps loading mounted until a fetched institution submission is available", async () => {
		mockedGetSubmissionById.mockResolvedValue({
			id: 11,
			entity_type: "institution",
		} as never);

		render(
			<SubmissionReviewModal
				submissionId={11}
				routePath="/account/submissions/11"
			/>,
		);

		expect(screen.getByText("Einreichung wird geladen...")).toBeInTheDocument();
		expect(institutionReviewMock).not.toHaveBeenCalled();
		expect(categoryReviewMock).not.toHaveBeenCalled();

		await waitFor(() => {
			expect(screen.getByText("institution-review")).toBeInTheDocument();
		});
		expect(institutionReviewMock).toHaveBeenCalledTimes(1);
		expect(categoryReviewMock).not.toHaveBeenCalled();
	});

	it("renders claim submissions with the institution review modal", () => {
		mockSubmissions = [
			{
				id: 13,
				entity_type: "institution",
				type: "claim",
			},
		];

		render(
			<SubmissionReviewModal
				submissionId={13}
				routePath="/account/submissions/13"
			/>,
		);

		expect(screen.getByText("institution-review")).toBeInTheDocument();
		expect(institutionReviewMock).toHaveBeenCalledWith(
			expect.objectContaining({
				submission: expect.objectContaining({
					id: 13,
					type: "claim",
				}),
			}),
		);
		expect(categoryReviewMock).not.toHaveBeenCalled();
	});
});
