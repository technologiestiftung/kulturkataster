import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InstitutionDraftEditModal } from "@/components/Institution/InstitutionDraftEditModal";
import { updateSubmission, getSubmissionById } from "@/server/actions/submissions";

const institutionFormModalMock = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ?? key,
	}),
}));

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/components/Institution/InstitutionFormModal", () => ({
	InstitutionFormModal: (props: Record<string, unknown>) => {
		institutionFormModalMock(props);
		return (
			<div>
				<button
					type="button"
					onClick={() => {
						const onSubmit = props.onSubmit as
							| ((args: { data: Record<string, unknown> }) => void)
							| undefined;
						onSubmit?.({
							data: {
								name: "Updated draft",
								"address.streetLine": "Main 1",
								"address.city": "Berlin",
								"address.zip": "10115",
							},
						});
					}}
				>
					submit-draft
				</button>
			</div>
		);
	},
}));

vi.mock("@/components/ui/alert-dialog", () => ({
	AlertDialog: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: {
			submissions: Array<Record<string, unknown>>;
			categories: Array<Record<string, unknown>>;
			upsertSubmission: (submission: unknown) => void;
			removeSubmission: (id: number) => void;
		}) => unknown,
	) =>
		selector({
			submissions: [
				{
					id: 11,
					entity_type: "institution",
					type: "create",
					data: {
						name: "Draft Name",
						address: { street: "Draft", street_number: "2", city: "Berlin" },
						categoryIds: [1],
					},
				},
			],
			categories: [{ id: 1, key: "cat-a", parent_category_id: null }],
			upsertSubmission: vi.fn(),
			removeSubmission: vi.fn(),
		}),
}));

vi.mock("@/server/actions/submissions", () => ({
	updateSubmission: vi.fn(),
	getSubmissionById: vi.fn(),
	deleteSubmission: vi.fn(),
}));

const mockedUpdateSubmission = vi.mocked(updateSubmission);
const mockedGetSubmissionById = vi.mocked(getSubmissionById);

describe("InstitutionDraftEditModal", () => {
	beforeEach(() => {
		institutionFormModalMock.mockReset();
		mockedUpdateSubmission.mockReset();
		mockedGetSubmissionById.mockReset();
		refreshMock.mockReset();
		mockedUpdateSubmission.mockResolvedValue({ id: 11 } as never);
	});

	it("renders form modal and updates draft submission", async () => {
		render(
			<InstitutionDraftEditModal
				submissionId={11}
				routePath="/account/submissions/11/edit"
			/>,
		);

		expect(institutionFormModalMock).toHaveBeenCalledTimes(1);
		const props = institutionFormModalMock.mock.calls[0][0] as {
			routePath: string;
			closeOnSubmit: boolean;
			submitLabel: string;
		};
		expect(props.routePath).toBe("/account/submissions/11/edit");
		expect(props.closeOnSubmit).toBe(true);
		expect(props.submitLabel).toBe("institutionFormModal.actions.save");

		fireEvent.click(screen.getByRole("button", { name: "submit-draft" }));

		await waitFor(() => {
			expect(mockedUpdateSubmission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 11 }),
			);
		});
	});

	it("shows not-found alert when submission does not exist", async () => {
		mockedGetSubmissionById.mockResolvedValueOnce(null);

		render(
			<InstitutionDraftEditModal
				submissionId={999}
				routePath="/account/submissions/999/edit"
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("institutionFormModal.dialog.notFound.title"),
			).toBeInTheDocument();
		});
	});
});
