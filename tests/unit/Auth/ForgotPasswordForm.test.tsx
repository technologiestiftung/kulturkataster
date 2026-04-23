import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ForgotPasswordForm } from "@/components/Auth/ForgotPasswordForm";
import { requestPasswordReset } from "@/server/actions/auth";

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
	usePathname: () => "/de/forgotPassword",
	useParams: () => ({ locale: "de" }),
}));

vi.mock("@/server/actions/auth", () => ({
	requestPasswordReset: vi.fn(),
}));

const mockedRequest = vi.mocked(requestPasswordReset);

describe("ForgotPasswordForm", () => {
	beforeEach(() => {
		mockedRequest.mockReset();
		replaceMock.mockReset();
	});

	it("submits email and shows success flow", async () => {
		mockedRequest.mockResolvedValue({ ok: true });

		render(<ForgotPasswordForm />);

		fireEvent.change(
			screen.getByPlaceholderText("auth.forgot.emailPlaceholder"),
			{
				target: { value: "jane@example.com" },
			},
		);

		fireEvent.click(screen.getByRole("button", { name: "auth.forgot.submit" }));

		await waitFor(() => {
			expect(mockedRequest).toHaveBeenCalledWith("jane@example.com");
		});
	});

	it("shows error when reset fails", async () => {
		mockedRequest.mockResolvedValue({ ok: false, error: "generic_error" });

		render(<ForgotPasswordForm />);

		fireEvent.change(
			screen.getByPlaceholderText("auth.forgot.emailPlaceholder"),
			{
				target: { value: "jane@example.com" },
			},
		);

		fireEvent.click(screen.getByRole("button", { name: "auth.forgot.submit" }));

		await waitFor(() => {
			expect(mockedRequest).toHaveBeenCalled();
		});

		expect(screen.getByText("auth.forgot.errorFallback")).toBeInTheDocument();
	});
});
