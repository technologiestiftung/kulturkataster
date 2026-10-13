import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InstitutionClaimSelectModal } from "@/components/Institution/InstitutionClaimSelectModal";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useAccountStore } from "@/lib/store/accountStore";
import { createSubmission } from "@/server/actions/submissions";
import { searchInstitutions } from "@/server/actions/institutions";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (
			key: string,
			options?: { defaultValue?: string; [key: string]: unknown },
		) => {
			let text = options?.defaultValue ?? key;
			if (options) {
				Object.entries(options).forEach(([k, v]) => {
					if (k === "defaultValue") return;
					text = text.replaceAll(`{{${k}}}`, String(v));
				});
			}
			return text;
		},
	}),
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

vi.mock("@/components/Institution/InstitutionDraftSelectSearch", () => ({
	InstitutionDraftSelectSearch: ({
		onQueryChange,
	}: {
		onQueryChange: (value: string) => void;
	}) => (
		<input
			aria-label="institution-search"
			onChange={(event) => onQueryChange(event.currentTarget.value)}
		/>
	),
}));

vi.mock("@/server/actions/submissions", () => ({
	createSubmission: vi.fn(),
}));

vi.mock("@/server/actions/institutions", () => ({
	searchInstitutions: vi.fn(),
}));

const mockedCreateSubmission = vi.mocked(createSubmission);
const mockedSearchInstitutions = vi.mocked(searchInstitutions);
const mockedShowSuccessToast = vi.mocked(showSuccessToast);

describe("InstitutionClaimSelectModal", () => {
	beforeEach(() => {
		closeModalMock.mockReset();
		mockedCreateSubmission.mockReset();
		mockedCreateSubmission.mockResolvedValue({} as never);
		mockedSearchInstitutions.mockReset();
		mockedShowSuccessToast.mockReset();

		useInstitutionStore.setState({
			allInstitutions: [
				{
					id: 10,
					name: "Institution Alpha",
					address: {
						street: "Alpha St",
						street_number: "1",
						zipcode: "10115",
						city: "Berlin",
					},
				},
				{
					id: 20,
					name: "Institution Beta",
					address: {
						street: "Beta St",
						street_number: "2",
						zipcode: "10117",
						city: "Berlin",
					},
				},
			],
			isLoading: false,
			error: null,
		} as never);

		useAccountStore.setState({
			institutions: [],
			submissions: [],
		} as never);
	});

	it("shows the number of selectable institutions and supports multi-select claim submit", async () => {
		mockedCreateSubmission
			.mockResolvedValueOnce({
				id: 901,
				entity_type: "institution",
				entity_id: 10,
				type: "claim",
				status: "approval_pending",
			} as never)
			.mockResolvedValueOnce({
				id: 902,
				entity_type: "institution",
				entity_id: 20,
				type: "claim",
				status: "approval_pending",
			} as never);

		render(
			<InstitutionClaimSelectModal routePath="/account/submissions/claim" />,
		);

		expect(screen.getByText("2 Ergebnisse")).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("checkbox", { name: /institution alpha/i }),
		);
		fireEvent.click(
			screen.getByRole("checkbox", { name: /institution beta/i }),
		);
		fireEvent.click(screen.getByRole("button", { name: /anfrage senden/i }));

		await waitFor(() => {
			expect(mockedCreateSubmission).toHaveBeenCalledTimes(2);
		});

		expect(mockedCreateSubmission).toHaveBeenCalledWith(
			expect.objectContaining({
				entityType: "institution",
				entityId: 10,
				type: "claim",
				data: expect.objectContaining({
					id: 10,
					name: "Institution Alpha",
					address: expect.objectContaining({
						street: "Alpha St",
						street_number: "1",
					}),
				}),
			}),
		);
		expect(mockedCreateSubmission).toHaveBeenCalledWith(
			expect.objectContaining({
				entityType: "institution",
				entityId: 20,
				type: "claim",
			}),
		);

		expect(
			useAccountStore
				.getState()
				.submissions.some(
					(submission) =>
						submission.type === "claim" && submission.entity_id === 10,
				),
		).toBe(true);
		expect(
			useAccountStore
				.getState()
				.submissions.some(
					(submission) =>
						submission.type === "claim" && submission.entity_id === 20,
				),
		).toBe(true);
		expect(closeModalMock).toHaveBeenCalledTimes(1);
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
	});

	it("uses search results when a query is provided", async () => {
		mockedSearchInstitutions.mockResolvedValue([
			{
				id: 99,
				name: "Institution Gamma",
				address: {
					street: "Gamma St",
					street_number: "9",
					zipcode: "10119",
					city: "Berlin",
				},
			},
		] as never);

		render(
			<InstitutionClaimSelectModal routePath="/account/submissions/claim" />,
		);

		fireEvent.change(screen.getByLabelText("institution-search"), {
			target: { value: "museum" },
		});

		await waitFor(() => {
			expect(mockedSearchInstitutions).toHaveBeenCalledWith("museum");
		});

		expect(
			screen.queryByRole("checkbox", { name: /institution alpha/i }),
		).toBeNull();
		expect(
			screen.getByRole("checkbox", { name: /institution gamma/i }),
		).toBeInTheDocument();
	});

	it("restores full institution list when search query is cleared", async () => {
		mockedSearchInstitutions.mockResolvedValue([
			{
				id: 99,
				name: "Institution Gamma",
				address: {
					street: "Gamma St",
					street_number: "9",
					zipcode: "10119",
					city: "Berlin",
				},
			},
		] as never);

		render(
			<InstitutionClaimSelectModal routePath="/account/submissions/claim" />,
		);

		const searchInput = screen.getByLabelText("institution-search");

		fireEvent.change(searchInput, { target: { value: "museum" } });

		await waitFor(() => {
			expect(mockedSearchInstitutions).toHaveBeenCalledWith("museum");
		});

		expect(
			screen.getByRole("checkbox", { name: /institution gamma/i }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("checkbox", { name: /institution alpha/i }),
		).toBeNull();

		fireEvent.change(searchInput, { target: { value: "" } });

		await waitFor(() => {
			expect(
				screen.getByRole("checkbox", { name: /institution alpha/i }),
			).toBeInTheDocument();
		});
		expect(
			screen.getByRole("checkbox", { name: /institution beta/i }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("checkbox", { name: /institution gamma/i }),
		).toBeNull();
	});
});
