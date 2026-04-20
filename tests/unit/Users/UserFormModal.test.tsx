import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UserFormModal } from "@/components/Users/UserFormModal";
import { createUser, updateUser } from "@/server/actions/users";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { useAccountStore } from "@/lib/store/accountStore";

const closeModalMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ?? key,
		i18n: { language: "de" },
	}),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: refreshMock }),
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
						email: "updated@example.com",
						first_name: "Ada",
						last_name: "Lovelace",
						status: "active",
						compliance: true,
						account_type: "org",
						roleId: "",
						groupIds: [],
						institutionIds: [],
					})
				}
			>
				Submit
			</button>
		</div>
	),
}));

vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (
		selector: (state: {
			allInstitutions: unknown[];
			categories: unknown[];
		}) => unknown,
	) => selector({ allInstitutions: [], categories: [] }),
}));

vi.mock("@/lib/hooks/useInstitutionMultiSelect", () => ({
	useInstitutionMultiSelect: () => ({
		institutionOptions: [],
		filteredInstitutionOptions: [],
		filterPanel: null,
	}),
}));

vi.mock("@/server/actions/users", () => ({
	createUser: vi.fn(),
	updateUser: vi.fn(),
	getUserById: vi.fn(),
	deleteUser: vi.fn(),
	sendComplianceResend: vi.fn(),
	sendPasswordReset: vi.fn(),
	sendRoleDecisionEmailManual: vi.fn(),
}));

vi.mock("@/lib/utils/feedbackToast", () => ({
	showSuccessToast: vi.fn(),
	showErrorToast: vi.fn(),
}));

const mockedCreateUser = vi.mocked(createUser);
const mockedUpdateUser = vi.mocked(updateUser);
const mockedShowSuccessToast = vi.mocked(showSuccessToast);

describe("UserFormModal", () => {
	beforeEach(() => {
		closeModalMock.mockReset();
		refreshMock.mockReset();
		mockedCreateUser.mockReset();
		mockedUpdateUser.mockReset();
		mockedShowSuccessToast.mockReset();
		useAccountStore.setState({
			users: [
				{
					id: "user-1",
					email: "editor@example.com",
					first_name: "Ada",
					last_name: "Lovelace",
					status: "active",
					account_type: "org",
					compliance: true,
					created_at: new Date("2025-01-01"),
					updated_at: new Date("2025-01-01"),
					role: null,
					groups: [],
					institutions: [],
					submissions: [],
				},
			],
			roles: [],
			groups: [],
		} as never);
	});

	it("creates a user in create mode", async () => {
		mockedCreateUser.mockResolvedValueOnce({
			ok: true,
			data: {
				id: "user-created",
				email: "updated@example.com",
				first_name: "Ada",
				last_name: "Lovelace",
				status: "active",
				account_type: "org",
				compliance: true,
				created_at: new Date("2025-01-01"),
				updated_at: new Date("2025-01-01"),
				role: null,
				groups: [],
				institutions: [],
				submissions: [],
			},
		} as never);

		render(<UserFormModal mode="create" routePath="/account/users/new" />);
		fireEvent.click(screen.getByRole("button", { name: "Submit" }));

		await waitFor(() => {
			expect(mockedCreateUser).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "updated@example.com",
					first_name: "Ada",
					last_name: "Lovelace",
				}),
			);
		});
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
		expect(closeModalMock).toHaveBeenCalledTimes(1);
	});

	it("updates a user in edit mode", async () => {
		mockedUpdateUser.mockResolvedValueOnce({
			ok: true,
			data: {
				id: "user-1",
				email: "updated@example.com",
				first_name: "Ada",
				last_name: "Lovelace",
				status: "active",
				account_type: "org",
				compliance: true,
				created_at: new Date("2025-01-01"),
				updated_at: new Date("2025-01-02"),
				role: null,
				groups: [],
				institutions: [],
				submissions: [],
			},
		} as never);

		render(
			<UserFormModal
				mode="edit"
				userId="user-1"
				routePath="/account/users/user-1/edit"
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Submit" }));

		await waitFor(() => {
			expect(mockedUpdateUser).toHaveBeenCalledWith(
				expect.objectContaining({
					id: "user-1",
					email: "updated@example.com",
				}),
			);
		});
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
		expect(closeModalMock).toHaveBeenCalledTimes(1);
	});
});
