import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UserClaimReviewModal } from "@/components/Users/UserClaimReviewModal";
import { reviewClaimSubmission } from "@/server/actions/submissions";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ?? key,
	}),
}));

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
	usePathname: () => "/de/account/users/1/review",
	useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({
		children,
		errorDialog,
	}: {
		children: React.ReactNode;
		errorDialog?: { open?: boolean; description?: string };
	}) => (
		<div>
			{children}
			{errorDialog?.open ? <div>{errorDialog.description}</div> : null}
		</div>
	),
}));

vi.mock("@/components/InfoWrapper/InfoWrapper", () => ({
	InfoWrapper: ({
		data,
		config,
	}: {
		data: Record<string, unknown>;
		config: {
			fields: Array<{
				label?: string;
				value?: string | ((input: Record<string, unknown>) => unknown);
			}>;
		};
	}) => (
		<div>
			{config.fields.map((field) => {
				const value =
					typeof field.value === "function" ? field.value(data) : field.value;
				return (
					<div key={field.label}>
						<span>{field.label}</span>
						<span>{String(value ?? "")}</span>
					</div>
				);
			})}
		</div>
	),
}));

vi.mock("@/server/actions/submissions", () => ({
	reviewClaimSubmission: vi.fn(),
}));

vi.mock("@/lib/utils/feedbackToast", () => ({
	showSuccessToast: vi.fn(),
	showErrorToast: vi.fn(),
}));

const mockedReviewClaimSubmission = vi.mocked(reviewClaimSubmission);
const mockedShowSuccessToast = vi.mocked(showSuccessToast);

describe("UserClaimReviewModal", () => {
	beforeEach(() => {
		refreshMock.mockReset();
		mockedReviewClaimSubmission.mockReset();
		mockedReviewClaimSubmission.mockResolvedValue({} as never);
		mockedShowSuccessToast.mockReset();
	});

	it("renders claim details, review link, and approves a claim", async () => {
		render(
			<UserClaimReviewModal
				routePath="/account/users/1/review"
				claims={[
					{
						submission: {
							id: 12,
							entity_id: 99,
							type: "claim",
							created_at: "2024-01-01T12:00:00Z",
						} as never,
						institution: {
							name: "Institution Alpha",
							address: {
								street: "Main",
								street_number: "12",
								zipcode: "10115",
								city: "Berlin",
							},
							users: [{ id: "user-1", email: "user@example.com" }],
						} as never,
						claimant: null,
					},
				]}
			/>,
		);

		expect(
			screen.getByText("Institution Alpha", { exact: false }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Main 12, 10115 Berlin", { exact: false }),
		).toBeInTheDocument();
		expect(
			screen.getByText("user@example.com", { exact: false }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /prüfen/i })).toHaveAttribute(
			"href",
			"/de/account/submissions/12",
		);

		fireEvent.click(screen.getByRole("button", { name: /annehmen/i }));

		await waitFor(() => {
			expect(mockedReviewClaimSubmission).toHaveBeenCalledWith({
				id: 12,
				decision: "approved",
			});
		});
		expect(refreshMock).toHaveBeenCalled();
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
	});

	it("rejects a claim and removes it from the list", async () => {
		render(
			<UserClaimReviewModal
				routePath="/account/users/1/review"
				claims={[
					{
						submission: {
							id: 33,
							entity_id: 100,
							type: "claim",
							created_at: "2024-01-02T12:00:00Z",
						} as never,
						institution: {
							name: "Institution Beta",
							address: {
								street: "Side",
								street_number: "5",
								zipcode: "10117",
								city: "Berlin",
							},
							users: [],
						} as never,
						claimant: null,
					},
				]}
			/>,
		);

		expect(
			screen.getByText("Institution Beta", { exact: false }),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /ablehnen/i }));

		await waitFor(() => {
			expect(mockedReviewClaimSubmission).toHaveBeenCalledWith({
				id: 33,
				decision: "rejected",
			});
		});

		await waitFor(() => {
			expect(
				screen.queryByText("Institution Beta", { exact: false }),
			).not.toBeInTheDocument();
		});
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
	});

	it("shows an error dialog when claim review fails", async () => {
		mockedReviewClaimSubmission.mockRejectedValueOnce(new Error("boom"));

		render(
			<UserClaimReviewModal
				routePath="/account/users/1/review"
				claims={[
					{
						submission: {
							id: 44,
							entity_id: 101,
							type: "claim",
							created_at: "2024-01-03T12:00:00Z",
						} as never,
						institution: {
							name: "Institution Gamma",
							address: null,
							users: [],
						} as never,
						claimant: null,
					},
				]}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /annehmen/i }));

		await waitFor(() => {
			expect(
				screen.getByText(
					"Please try again or contact support if the issue persists.",
				),
			).toBeInTheDocument();
		});
		expect(mockedShowSuccessToast).not.toHaveBeenCalled();
		expect(refreshMock).not.toHaveBeenCalled();
	});
});
