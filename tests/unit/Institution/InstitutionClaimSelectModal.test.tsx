import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InstitutionClaimSelectModal } from "@/components/Institution/InstitutionClaimSelectModal";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { createSubmission } from "@/server/actions/submissions";
import { searchInstitutions } from "@/server/actions/institutions";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ?? key,
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
		<button type="button" onClick={() => onQueryChange("museum")}>
			mock-search
		</button>
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
	});

	it("creates claim submissions for selected institutions and redirects", async () => {
		render(
			<InstitutionClaimSelectModal routePath="/account/submissions/claim" />,
		);

		fireEvent.click(screen.getByRole("button", { name: /institution alpha/i }));
		fireEvent.click(screen.getByRole("button", { name: /anfrage senden/i }));

		await waitFor(() => {
			expect(mockedCreateSubmission).toHaveBeenCalledTimes(1);
		});

		expect(mockedCreateSubmission).toHaveBeenCalledWith(
			expect.objectContaining({
				entityType: "institution",
				entityId: 10,
				type: "claim",
				status: "approval_pending",
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

		fireEvent.click(screen.getByRole("button", { name: /mock-search/i }));

		await waitFor(() => {
			expect(mockedSearchInstitutions).toHaveBeenCalledWith("museum");
		});

		expect(
			screen.queryByRole("button", { name: /institution alpha/i }),
		).toBeNull();
		expect(
			screen.getByRole("button", { name: /institution gamma/i }),
		).toBeInTheDocument();
	});
});
