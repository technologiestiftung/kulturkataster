/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AccountEditForm } from "@/components/Account/AccountEditForm";
import { updateUser, deleteUser } from "@/server/actions/users";
import { updateMyPassword, logout } from "@/server/actions/auth";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: {
			changeLanguage: () => new Promise(() => {}),
		},
	}),
}));

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		replace: replaceMock,
	}),
	usePathname: () => "/de/account/edit",
	useParams: () => ({ locale: "de" }),
}));

vi.mock("idb-keyval", () => ({
	get: vi.fn(),
	set: vi.fn(),
	del: vi.fn(),
}));

vi.mock("@/server/actions/users", () => ({
	updateUser: vi.fn(),
	deleteUser: vi.fn(),
}));

vi.mock("@/server/actions/auth", () => ({
	updateMyPassword: vi.fn(),
	logout: vi.fn(),
}));

const mockedUpdateUser = vi.mocked(updateUser);
const mockedDeleteUser = vi.mocked(deleteUser);
const mockedUpdatePassword = vi.mocked(updateMyPassword);
const mockedLogout = vi.mocked(logout);

describe("AccountEditForm", () => {
	beforeEach(() => {
		mockedUpdateUser.mockReset();
		mockedDeleteUser.mockReset();
		mockedUpdatePassword.mockReset();
		mockedLogout.mockReset();
		replaceMock.mockReset();
	});

	it("renders prefilled personal information fields", () => {
		render(
			<AccountEditForm
				userId="user-1"
				email="user@example.com"
				firstName="Jane"
				lastName="Doe"
			/>,
		);

		expect(
			screen.getByPlaceholderText("auth.accountEdit.namePlaceholder"),
		).toHaveValue("Jane Doe");
		expect(
			screen.getByPlaceholderText("auth.accountEdit.emailPlaceholder"),
		).toHaveValue("user@example.com");
	});

	it("submits updated profile data", async () => {
		mockedUpdateUser.mockResolvedValue({ ok: true, data: {} } as any);
		mockedUpdatePassword.mockResolvedValue({ ok: true });

		render(
			<AccountEditForm
				userId="user-1"
				email="user@example.com"
				firstName="Jane"
				lastName="Doe"
			/>,
		);

		fireEvent.change(
			screen.getByPlaceholderText("auth.accountEdit.namePlaceholder"),
			{ target: { value: "Jane Doe" } },
		);
		fireEvent.change(
			screen.getByPlaceholderText("auth.accountEdit.emailPlaceholder"),
			{ target: { value: "new@example.com" } },
		);

		fireEvent.click(
			screen.getByRole("button", { name: "auth.accountEdit.submit" }),
		);

		await waitFor(() => {
			expect(mockedUpdateUser).toHaveBeenCalled();
			expect(mockedUpdatePassword).not.toHaveBeenCalled();
		});
	});

	it("updates password when provided", async () => {
		mockedUpdateUser.mockResolvedValue({ ok: true, data: {} } as any);
		mockedUpdatePassword.mockResolvedValue({ ok: true });

		render(
			<AccountEditForm
				userId="user-1"
				email="user@example.com"
				firstName="Jane"
				lastName="Doe"
			/>,
		);

		fireEvent.change(
			screen.getByPlaceholderText("auth.accountEdit.passwordPlaceholder"),
			{ target: { value: "Password123!" } },
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				"auth.accountEdit.confirmPasswordPlaceholder",
			),
			{ target: { value: "Password123!" } },
		);

		fireEvent.click(
			screen.getByRole("button", { name: "auth.accountEdit.submit" }),
		);

		await waitFor(() => {
			expect(mockedUpdatePassword).toHaveBeenCalledWith("Password123!");
		});
	});

	it("shows error when passwords do not match", async () => {
		render(
			<AccountEditForm
				userId="user-1"
				email="user@example.com"
				firstName="Jane"
				lastName="Doe"
			/>,
		);

		fireEvent.change(
			screen.getByPlaceholderText("auth.accountEdit.passwordPlaceholder"),
			{ target: { value: "Password123!" } },
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				"auth.accountEdit.confirmPasswordPlaceholder",
			),
			{ target: { value: "Password123" } },
		);

		fireEvent.click(
			screen.getByRole("button", { name: "auth.accountEdit.submit" }),
		);

		await waitFor(() => {
			expect(
				screen.getByText("auth.validation.passwordMismatch"),
			).toBeDefined();
		});
	});

	it("deletes profile after confirmation", async () => {
		mockedDeleteUser.mockResolvedValue({
			ok: true,
			data: { id: "user-1" },
		} as any);
		mockedLogout.mockResolvedValue({ ok: true });

		render(
			<AccountEditForm
				userId="user-1"
				email="user@example.com"
				firstName="Jane"
				lastName="Doe"
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: "auth.accountEdit.deleteAction" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "auth.accountEdit.deleteConfirm" }),
		);

		await waitFor(() => {
			expect(mockedDeleteUser).toHaveBeenCalledWith("user-1");
			expect(mockedLogout).toHaveBeenCalled();
			expect(replaceMock).toHaveBeenCalledWith("/de/");
		});
	});
});
