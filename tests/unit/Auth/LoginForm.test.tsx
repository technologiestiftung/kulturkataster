import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoginForm } from "@/components/Auth/LoginForm";
import { loginWithEmailPassword } from "@/server/actions/auth";

const replaceMock = vi.fn();
const pushMock = vi.fn();
const prefetchMock = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: pushMock,
		replace: replaceMock,
		prefetch: prefetchMock,
	}),
	usePathname: () => "/de/login",
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

vi.mock("@/server/actions/auth", () => ({
	loginWithEmailPassword: vi.fn(),
}));

const mockedLogin = vi.mocked(loginWithEmailPassword);

describe("LoginForm", () => {
	beforeEach(() => {
		mockedLogin.mockReset();
		replaceMock.mockReset();
		pushMock.mockReset();
		prefetchMock.mockReset();
	});

	it("uses app router navigation after successful login", async () => {
		mockedLogin.mockResolvedValue({ ok: true, approvalPending: false });

		render(<LoginForm />);

		fireEvent.change(
			screen.getByPlaceholderText("common.auth.login.emailPlaceholder"),
			{
				target: { value: "jane@example.com" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.login.passwordPlaceholder"),
			{
				target: { value: "password123" },
			},
		);

		fireEvent.click(
			screen.getByRole("button", { name: "common.auth.login.submit" }),
		);

		await waitFor(() => {
			expect(mockedLogin).toHaveBeenCalledWith(
				"jane@example.com",
				"password123",
			);
			expect(prefetchMock).toHaveBeenCalledWith("/de/account/activity");
			expect(replaceMock).toHaveBeenCalledWith("/de/account/activity");
		});
	});

	it("shows invalid credentials without navigating", async () => {
		mockedLogin.mockResolvedValue({
			ok: false,
			error: "invalid_credentials",
		});

		render(<LoginForm />);

		fireEvent.change(
			screen.getByPlaceholderText("common.auth.login.emailPlaceholder"),
			{
				target: { value: "jane@example.com" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.login.passwordPlaceholder"),
			{
				target: { value: "wrong-password" },
			},
		);

		fireEvent.click(
			screen.getByRole("button", { name: "common.auth.login.submit" }),
		);

		await waitFor(() => {
			expect(
				screen.getByText("common.auth.login.invalidCredentials"),
			).toBeInTheDocument();
		});
		expect(replaceMock).not.toHaveBeenCalled();
	});
});
