import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UserFormModal } from "@/components/Users/UserFormModal";
import {
	createUser,
	getUserEmailTemplateOptions,
	sendUserEmailTemplate,
	updateUser,
} from "@/server/actions/users";
import { showErrorToast, showSuccessToast } from "@/lib/utils/feedbackToast";
import { useAccountStore } from "@/lib/store/accountStore";

const closeModalMock = vi.fn();
const refreshMock = vi.fn();
const { triggerAccountRefreshMock } = vi.hoisted(() => ({
	triggerAccountRefreshMock: vi.fn(),
}));

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

vi.mock("@/components/Account/AccountAutoRefresh", () => ({
	triggerAccountRefresh: triggerAccountRefreshMock,
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DialogContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/icons/mail.svg", () => ({ default: () => null }));

type MockFieldConfig = {
	afterField?: React.ReactNode;
	customField?: React.ReactNode;
	fields?: MockFieldConfig[];
};

const collectExtraFields = (
	fields?: MockFieldConfig[],
): React.ReactElement[] => {
	if (!fields) return [];
	const result: React.ReactElement[] = [];
	let index = 0;
	for (const field of fields) {
		if (field.afterField) {
			result.push(<div key={`after-${index}`}>{field.afterField}</div>);
			index += 1;
		}
		if (field.customField) {
			result.push(<div key={`custom-${index}`}>{field.customField}</div>);
			index += 1;
		}
		if (field.fields) result.push(...collectExtraFields(field.fields));
	}
	return result;
};

vi.mock("@/components/FormWrapper", () => ({
	FormWrapper: ({
		config,
	}: {
		config: {
			fields?: MockFieldConfig[];
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
			{collectExtraFields(config.fields)}
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
	getUserEmailTemplateOptions: vi
		.fn()
		.mockResolvedValue({ ok: true, data: [] }),
	sendUserEmailTemplate: vi.fn(),
}));

vi.mock("@/lib/utils/feedbackToast", () => ({
	showSuccessToast: vi.fn(),
	showErrorToast: vi.fn(),
}));

const mockedCreateUser = vi.mocked(createUser);
const mockedUpdateUser = vi.mocked(updateUser);
const mockedShowSuccessToast = vi.mocked(showSuccessToast);
const mockedShowErrorToast = vi.mocked(showErrorToast);
const mockedGetUserEmailTemplateOptions = vi.mocked(
	getUserEmailTemplateOptions,
);
const mockedSendUserEmailTemplate = vi.mocked(sendUserEmailTemplate);

describe("UserFormModal", () => {
	beforeEach(() => {
		closeModalMock.mockReset();
		refreshMock.mockReset();
		triggerAccountRefreshMock.mockReset();
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

	it("closes before triggering the background account refresh after update", async () => {
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
			expect(closeModalMock).toHaveBeenCalledTimes(1);
		});

		expect(triggerAccountRefreshMock).toHaveBeenCalledWith([
			"users",
			"entityAudits",
		]);
		expect(closeModalMock.mock.invocationCallOrder[0]).toBeLessThan(
			triggerAccountRefreshMock.mock.invocationCallOrder[0],
		);
	});
});

describe("UserTemplateEmailPanel", () => {
	const editUser = {
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
	};

	beforeEach(() => {
		mockedGetUserEmailTemplateOptions.mockReset();
		mockedSendUserEmailTemplate.mockReset();
		mockedShowSuccessToast.mockReset();
		mockedShowErrorToast.mockReset();
		useAccountStore.setState({
			users: [editUser],
			roles: [],
			groups: [],
		} as never);
	});

	it("loads and displays templates in edit mode", async () => {
		mockedGetUserEmailTemplateOptions.mockResolvedValue({
			ok: true,
			data: [
				{
					key: "custom.claim_approved",
					path: "custom/claim_approved.html",
					name: "Claim bestätigt",
				},
				{
					key: "custom.submission_approved",
					path: "custom/submission_approved.html",
					name: "Einreichung bestätigt",
				},
			],
		} as never);

		render(<UserFormModal mode="edit" userId="user-1" />);

		await waitFor(() => {
			expect(mockedGetUserEmailTemplateOptions).toHaveBeenCalledTimes(1);
		});
	});

	it("sends the selected template and shows success toast", async () => {
		mockedGetUserEmailTemplateOptions.mockResolvedValue({
			ok: true,
			data: [
				{
					key: "custom.claim_approved",
					path: "custom/claim_approved.html",
					name: "Claim bestätigt",
				},
			],
		} as never);
		mockedSendUserEmailTemplate.mockResolvedValue({ ok: true } as never);

		render(<UserFormModal mode="edit" userId="user-1" />);

		await waitFor(() => {
			expect(mockedGetUserEmailTemplateOptions).toHaveBeenCalledTimes(1);
		});

		fireEvent.click(
			screen.getByRole("button", {
				name: /userFormModal\.templateEmail\.send/i,
			}),
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: /userFormModal\.templateEmail\.confirmSend/i,
			}),
		);

		await waitFor(() => {
			expect(mockedSendUserEmailTemplate).toHaveBeenCalledWith({
				userId: "user-1",
				templatePath: "custom/claim_approved.html",
			});
			expect(mockedShowSuccessToast).toHaveBeenCalled();
		});
	});

	it("shows error toast when sending fails", async () => {
		mockedGetUserEmailTemplateOptions.mockResolvedValue({
			ok: true,
			data: [
				{
					key: "custom.claim_approved",
					path: "custom/claim_approved.html",
					name: "Claim bestätigt",
				},
			],
		} as never);
		mockedSendUserEmailTemplate.mockResolvedValue({
			ok: false,
			error: "unexpected",
		} as never);

		render(<UserFormModal mode="edit" userId="user-1" />);

		await waitFor(() => {
			expect(mockedGetUserEmailTemplateOptions).toHaveBeenCalledTimes(1);
		});

		fireEvent.click(
			screen.getByRole("button", {
				name: /userFormModal\.templateEmail\.send/i,
			}),
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: /userFormModal\.templateEmail\.confirmSend/i,
			}),
		);

		await waitFor(() => {
			expect(mockedShowErrorToast).toHaveBeenCalled();
		});
	});

	it("does not show the template panel in create mode", () => {
		render(<UserFormModal mode="create" />);
		expect(mockedGetUserEmailTemplateOptions).not.toHaveBeenCalled();
	});
});
