/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	render,
	screen,
	fireEvent,
	waitFor,
	within,
} from "@testing-library/react";
import { RegisterForm } from "@/components/Auth/RegisterForm";
import { registerWithEmailPassword } from "@/server/actions/auth";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: {
			changeLanguage: () => new Promise(() => {}),
		},
	}),
}));

vi.mock("@/components/ui/select", () => ({
	Select: ({ value, onValueChange, children }: any) => (
		<select
			value={value ?? ""}
			onChange={(event) => onValueChange?.(event.target.value)}
			aria-label="common.auth.register.accountType"
		>
			{children}
		</select>
	),
	SelectTrigger: ({ children }: any) => <>{children}</>,
	SelectValue: ({ placeholder }: any) => (
		<option value="">{placeholder}</option>
	),
	SelectContent: ({ children }: any) => <>{children}</>,
	SelectItem: ({ value, children }: any) => (
		<option value={value}>{children}</option>
	),
	SelectSeparator: () => null,
	SelectScrollUpButton: () => null,
	SelectScrollDownButton: () => null,
	SelectGroup: ({ children }: any) => <>{children}</>,
	SelectLabel: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/server/actions/auth", () => ({
	registerWithEmailPassword: vi.fn(),
}));

const mockedRegister = vi.mocked(registerWithEmailPassword);

describe("RegisterForm", () => {
	beforeEach(() => {
		mockedRegister.mockReset();
	});

	it("uses the translated null option for account type", () => {
		render(<RegisterForm />);

		expect(
			within(screen.getByRole("combobox")).getByRole("option", {
				name: "common.selectPlaceholder",
			}),
		).toBeInTheDocument();
	});

	it("shows validation errors for invalid email and password mismatch", async () => {
		render(<RegisterForm />);

		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "organization" },
		});

		fireEvent.change(
			screen.getByPlaceholderText(
				"common.auth.register.organizationNamePlaceholder",
			),
			{
				target: { value: "Org" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				"common.auth.register.organizationPositionPlaceholder",
			),
			{
				target: { value: "Lead" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				"common.auth.register.organizationPhonePlaceholder",
			),
			{
				target: { value: "123456" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.register.firstNamePlaceholder"),
			{
				target: { value: "Jane" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.register.lastNamePlaceholder"),
			{
				target: { value: "Doe" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.register.emailPlaceholder"),
			{
				target: { value: "invalid-email" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.register.passwordPlaceholder"),
			{
				target: { value: "password123" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				"common.auth.register.confirmPasswordPlaceholder",
			),
			{
				target: { value: "password321" },
			},
		);
		fireEvent.click(
			screen.getByRole("checkbox", { name: /common.auth.register.termsIntro/ }),
		);

		fireEvent.click(
			screen.getByRole("button", { name: "common.auth.register.submit" }),
		);

		expect(mockedRegister).not.toHaveBeenCalled();
	});

	it("calls onSuccess after a successful registration", async () => {
		const onSuccess = vi.fn();
		mockedRegister.mockResolvedValue({ ok: true, needsConfirmation: true });

		render(<RegisterForm onSuccess={onSuccess} />);

		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "organization" },
		});

		fireEvent.change(
			screen.getByPlaceholderText(
				"common.auth.register.organizationNamePlaceholder",
			),
			{
				target: { value: "Org" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				"common.auth.register.organizationPositionPlaceholder",
			),
			{
				target: { value: "Lead" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				"common.auth.register.organizationPhonePlaceholder",
			),
			{
				target: { value: "123456" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.register.firstNamePlaceholder"),
			{
				target: { value: "Jane" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.register.lastNamePlaceholder"),
			{
				target: { value: "Doe" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.register.emailPlaceholder"),
			{
				target: { value: "jane@example.com" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.register.passwordPlaceholder"),
			{
				target: { value: "password123" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				"common.auth.register.confirmPasswordPlaceholder",
			),
			{
				target: { value: "password123" },
			},
		);
		fireEvent.click(
			screen.getByRole("checkbox", { name: /common.auth.register.termsIntro/ }),
		);

		fireEvent.click(
			screen.getByRole("button", { name: "common.auth.register.submit" }),
		);

		await waitFor(() => {
			expect(mockedRegister).toHaveBeenCalled();
			expect(onSuccess).toHaveBeenCalled();
		});
	});

	it("blocks submit when password is shorter than 8 characters", async () => {
		render(<RegisterForm />);

		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "organization" },
		});

		fireEvent.change(
			screen.getByPlaceholderText(
				"common.auth.register.organizationNamePlaceholder",
			),
			{
				target: { value: "Org" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				"common.auth.register.organizationPositionPlaceholder",
			),
			{
				target: { value: "Lead" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				"common.auth.register.organizationPhonePlaceholder",
			),
			{
				target: { value: "123456" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.register.firstNamePlaceholder"),
			{
				target: { value: "Jane" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.register.lastNamePlaceholder"),
			{
				target: { value: "Doe" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.register.emailPlaceholder"),
			{
				target: { value: "jane@example.com" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText("common.auth.register.passwordPlaceholder"),
			{
				target: { value: "short7" },
			},
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				"common.auth.register.confirmPasswordPlaceholder",
			),
			{
				target: { value: "short7" },
			},
		);
		fireEvent.click(
			screen.getByRole("checkbox", { name: /common.auth.register.termsIntro/ }),
		);

		fireEvent.click(
			screen.getByRole("button", { name: "common.auth.register.submit" }),
		);

		await waitFor(() => {
			expect(
				screen.getByText("common.auth.validation.passwordMin"),
			).toBeInTheDocument();
		});
		expect(mockedRegister).not.toHaveBeenCalled();
	});
});
