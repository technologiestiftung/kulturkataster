import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";
import {
	createInstitution,
	updateInstitution,
} from "@/server/actions/institutions";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

const closeModalMock = vi.fn();
const addInstitutionMock = vi.fn();
const upsertInstitutionMock = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ?? key,
	}),
}));

vi.mock("@/components/Modals/useRoutedModalClose", () => ({
	useRoutedModalClose: () => closeModalMock,
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/dialog", () => ({
	DialogTitle: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/FormWrapper", () => ({
	FormWrapper: ({
		config,
	}: {
		config: {
			onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
		};
	}) => (
		<div>
			<button
				type="button"
				onClick={() =>
					void config.onSubmit({
						name: "New Institution",
						categoryIds: ["1"],
						"address.streetLine": "Main 1",
						"address.city": "Berlin",
						"address.zip": "10115",
						"address.lat": "52.5",
						"address.lng": "13.4",
						website: "https://example.com",
						email: "contact@example.com",
						phone: "+49 30 123",
						funding_sources: [],
					})
				}
			>
				submit-form
			</button>
		</div>
	),
}));

vi.mock("@/server/actions/institutions", () => ({
	createInstitution: vi.fn(),
	updateInstitution: vi.fn(),
}));

vi.mock("@/lib/utils/feedbackToast", () => ({
	showSuccessToast: vi.fn(),
}));

vi.mock("@/lib/hooks/useInstitutionPrivateFieldResolver", () => ({
	useInstitutionPrivateFieldResolver: () => ({
		isPrivateField: () => false,
	}),
}));

vi.mock("@/lib/utils/institutionFieldAccess", () => ({
	applyInstitutionFieldAccess: ({ fields }: { fields: unknown }) => fields,
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: {
			addInstitution: (item: unknown) => void;
			upsertInstitution: (item: unknown) => void;
			institutionFieldPermissions: {
				read: string[];
				create: string[];
				update: string[];
				delete: string[];
			};
		}) => unknown,
	) =>
		selector({
			addInstitution: addInstitutionMock,
			upsertInstitution: upsertInstitutionMock,
			institutionFieldPermissions: {
				read: [],
				create: [],
				update: [],
				delete: [],
			},
		}),
}));

vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (
		selector: (state: {
			categories: Array<Record<string, unknown>>;
		}) => unknown,
	) =>
		selector({
			categories: [
				{ id: 1, key: "cat-a", parent_category_id: null, child_categories: [] },
			],
		}),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: vi.fn() }),
}));

const mockedCreateInstitution = vi.mocked(createInstitution);
const mockedUpdateInstitution = vi.mocked(updateInstitution);
const mockedShowSuccessToast = vi.mocked(showSuccessToast);

describe("InstitutionFormModal", () => {
	beforeEach(() => {
		closeModalMock.mockReset();
		addInstitutionMock.mockReset();
		upsertInstitutionMock.mockReset();
		mockedCreateInstitution.mockReset();
		mockedUpdateInstitution.mockReset();
		mockedShowSuccessToast.mockReset();

		mockedCreateInstitution.mockResolvedValue({
			id: 1,
			name: "New Institution",
		} as never);
		mockedUpdateInstitution.mockResolvedValue({
			id: 2,
			name: "Updated Institution",
		} as never);
	});

	it("creates a new institution", async () => {
		render(
			<InstitutionFormModal
				mode="create"
				routePath="/account/institutions/new"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "submit-form" }));

		await waitFor(() => {
			expect(mockedCreateInstitution).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "New Institution",
					categoryIds: [1],
				}),
			);
		});
		expect(addInstitutionMock).toHaveBeenCalledTimes(1);
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
		expect(closeModalMock).toHaveBeenCalledTimes(1);
	});

	it("updates an existing institution", async () => {
		render(
			<InstitutionFormModal
				mode="edit"
				institution={
					{
						id: 2,
						name: "Existing",
						address: { id: 9 },
						categories: [],
					} as never
				}
				routePath="/account/institutions/2/edit"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "submit-form" }));

		await waitFor(() => {
			expect(mockedUpdateInstitution).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 2,
					name: "New Institution",
				}),
			);
		});
		expect(upsertInstitutionMock).toHaveBeenCalledTimes(1);
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
		expect(closeModalMock).toHaveBeenCalledTimes(1);
	});
});
