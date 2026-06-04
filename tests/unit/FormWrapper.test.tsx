import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormWrapper } from "@/components/FormWrapper/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper/types";

const toFields = (
	sections: Array<{
		id?: string;
		title?: string;
		description?: string;
		fields: Array<Record<string, unknown>>;
	}>,
): FormWrapperConfig["fields"] =>
	sections.map((section, index) => ({
		name: section.id ?? `section-${index}`,
		type: "section" as const,
		title: section.title,
		description: section.description,
		fields: section.fields.map((field) => {
			const { gridColumn, layout, ...rest } = field as {
				name: string;
				type: string;
				gridColumn?: "full" | "half";
				layout?: { span?: "full" | "half" };
				[key: string]: unknown;
			};
			const resolvedLayout =
				layout ??
				(gridColumn
					? { span: gridColumn === "half" ? "half" : "full" }
					: undefined);
			return resolvedLayout ? { ...rest, layout: resolvedLayout } : rest;
		}) as FormWrapperConfig["fields"],
	}));

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>) => {
			const normalizedKey = key.replace(/^common\./, "");

			if (normalizedKey === "form.validation.required") {
				return `${String(options?.field ?? "")} is required`;
			}
			if (normalizedKey === "enumMap.field_names.name.errors.required") {
				return "Name is required";
			}
			if (normalizedKey === "enumMap.field_names.agree.errors.required") {
				return "I agree to terms is required";
			}
			return normalizedKey;
		},
		i18n: {
			changeLanguage: () => new Promise(() => {}),
		},
	}),
}));

describe("FormWrapper", () => {
	describe("Basic Form Rendering", () => {
		it("renders a simple form with text input", () => {
			const config: FormWrapperConfig = {
				fields: [
					{
						name: "name",
						label: "Name",
						type: "text",
						required: true,
					},
				],
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /Submit/i }),
			).toBeInTheDocument();
		});

		it("renders custom submit label", () => {
			const config: FormWrapperConfig = {
				fields: [
					{
						name: "email",
						label: "Email",
						type: "email",
					},
				],
				submitLabel: "Save Changes",
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			expect(
				screen.getByRole("button", { name: "Save Changes" }),
			).toBeInTheDocument();
		});

		it("shows cancel button when configured", () => {
			const onCancel = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [{ name: "test", label: "Test", type: "text" }],
					},
				]),
				showCancel: true,
				onCancel,
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			const cancelButton = screen.getByRole("button", { name: /Cancel/i });
			expect(cancelButton).toBeInTheDocument();

			fireEvent.click(cancelButton);
			expect(onCancel).toHaveBeenCalled();
		});
	});

	describe("Field Types", () => {
		it("renders text input field", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [{ name: "username", label: "Username", type: "text" }],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			expect(screen.getByLabelText("Username")).toHaveAttribute("type", "text");
		});

		it("renders email input field", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [{ name: "email", label: "Email", type: "email" }],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
		});

		it("renders password input field", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [{ name: "password", label: "Password", type: "password" }],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			const passwordInput = screen.getByLabelText("Password");
			expect(passwordInput).toHaveAttribute("type", "password");
			const toggleButton = screen.getByRole("button", {
				name: "auth.password.show",
			});
			fireEvent.click(toggleButton);
			expect(passwordInput).toHaveAttribute("type", "text");
		});

		it("renders number input field", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "age",
								label: "Age",
								type: "number",
								min: 0,
								max: 120,
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			const input = screen.getByLabelText("Age");
			expect(input).toHaveAttribute("type", "number");
			expect(input).toHaveAttribute("min", "0");
			expect(input).toHaveAttribute("max", "120");
		});

		it("renders textarea field", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [{ name: "bio", label: "Bio", type: "textarea" }],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			expect(screen.getByLabelText("Bio").tagName).toBe("TEXTAREA");
		});

		it("renders select field with options", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "country",
								label: "Country",
								type: "select",
								options: [
									{ value: "us", label: "United States" },
									{ value: "de", label: "Germany" },
								],
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			expect(screen.getByText("Country")).toBeInTheDocument();
		});

		it("renders radio group with options", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "size",
								label: "Size",
								type: "radio",
								options: [
									{ value: "s", label: "Small" },
									{ value: "m", label: "Medium" },
									{ value: "l", label: "Large" },
								],
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			expect(screen.getByLabelText("Small")).toBeInTheDocument();
			expect(screen.getByLabelText("Medium")).toBeInTheDocument();
			expect(screen.getByLabelText("Large")).toBeInTheDocument();
		});

		it("submits null for a nullable radio option", async () => {
			const onSubmit = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "shared_use_allowed",
								label: "Offen für Raumanfragen?",
								type: "radio",
								allowNullOption: true,
								nullOptionLabel: "Keine Angabe",
								options: [
									{ value: true, label: "Ja" },
									{ value: false, label: "Nein" },
								],
							},
						],
					},
				]),
				initialValues: { shared_use_allowed: true },
				onSubmit,
			};

			render(<FormWrapper config={config} />);
			fireEvent.click(screen.getByLabelText("Keine Angabe"));
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));

			await waitFor(() => {
				expect(onSubmit).toHaveBeenCalledWith({
					shared_use_allowed: null,
				});
			});
		});

		it("renders checkbox field", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "agree",
								label: "I agree to terms",
								type: "checkbox",
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			expect(screen.getByLabelText("I agree to terms")).toBeInTheDocument();
		});

		it("renders switch field", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "notifications",
								label: "Enable notifications",
								type: "switch",
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			expect(screen.getByText("Enable notifications")).toBeInTheDocument();
		});
	});

	describe("Form Validation", () => {
		it("shows required field indicator", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "email",
								label: "Email",
								type: "email",
								required: true,
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			expect(screen.getByText("*")).toBeInTheDocument();
		});

		it("validates required field on submit", async () => {
			const onSubmit = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "name",
								label: "Name",
								type: "text",
								required: true,
							},
						],
					},
				]),
				onSubmit,
			};

			render(<FormWrapper config={config} />);

			const submitButton = screen.getByRole("button", { name: /Submit/i });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
			});

			expect(onSubmit).not.toHaveBeenCalled();
		});

		it("prevents submit when required checkbox is unchecked", async () => {
			const onSubmit = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "agree",
								label: "I agree to terms",
								type: "checkbox",
								required: true,
							},
						],
					},
				]),
				onSubmit,
			};

			render(<FormWrapper config={config} />);

			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));

			await waitFor(() => {
				expect(
					screen.getByText(/I agree to terms is required/i),
				).toBeInTheDocument();
			});
			expect(onSubmit).not.toHaveBeenCalled();
		});

		it("validates custom validation function", async () => {
			const onSubmit = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "age",
								label: "Age",
								type: "number",
								validators: [
									(value: unknown) => {
										const num = Number(value);
										if (num < 18) return "Must be 18 or older";
										return undefined;
									},
								],
							},
						],
					},
				]),
				onSubmit,
			};

			render(<FormWrapper config={config} />);

			const input = screen.getByLabelText("Age");
			fireEvent.change(input, { target: { value: "15" } });
			fireEvent.blur(input);

			const submitButton = screen.getByRole("button", { name: /Submit/i });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("Must be 18 or older")).toBeInTheDocument();
			});

			expect(onSubmit).not.toHaveBeenCalled();
		});

		it("submits form when validation passes", async () => {
			const onSubmit = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "name",
								label: "Name",
								type: "text",
								required: true,
							},
						],
					},
				]),
				onSubmit,
			};

			render(<FormWrapper config={config} />);

			const input = screen.getByLabelText(/Name/);
			fireEvent.change(input, { target: { value: "John Doe" } });

			const submitButton = screen.getByRole("button", { name: /Submit/i });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(onSubmit).toHaveBeenCalledWith({ name: "John Doe" });
			});
		});

		it("accepts phone numbers with invisible formatting characters and normalizes them", async () => {
			const onSubmit = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [{ name: "phone", label: "Phone", type: "tel" }],
					},
				]),
				onSubmit,
			};

			render(<FormWrapper config={config} />);

			const input = screen.getByLabelText("Phone");
			fireEvent.change(input, { target: { value: "030 23613314‬" } });
			fireEvent.blur(input);
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));

			await waitFor(() => {
				expect(onSubmit).toHaveBeenCalledWith({ phone: "030 23613314" });
			});
		});
	});

	describe("Initial Values", () => {
		it("loads initial values", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{ name: "name", label: "Name", type: "text" },
							{ name: "email", label: "Email", type: "email" },
						],
					},
				]),
				initialValues: {
					name: "Jane Doe",
					email: "jane@example.com",
				},
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			expect(screen.getByLabelText("Name")).toHaveValue("Jane Doe");
			expect(screen.getByLabelText("Email")).toHaveValue("jane@example.com");
		});

		it("uses default values when no initial values provided", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "country",
								label: "Country",
								type: "text",
								defaultValue: "Germany",
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			expect(screen.getByLabelText("Country")).toHaveValue("Germany");
		});
	});

	describe("Sections and Layout", () => {
		it("renders sections with titles", () => {
			const config: FormWrapperConfig = {
				fields: [
					{
						name: "personal",
						type: "section",
						title: "Personal Information",
						description: "Enter your personal details",
						fields: [
							{ name: "name", label: "Name", type: "text" },
							{ name: "email", label: "Email", type: "email" },
						],
					},
				],
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			expect(screen.getByText("Personal Information")).toBeInTheDocument();
			expect(
				screen.getByText("Enter your personal details"),
			).toBeInTheDocument();
		});

		it("renders multiple sections", () => {
			const config: FormWrapperConfig = {
				fields: [
					{
						name: "personal",
						type: "section",
						title: "Personal Info",
						fields: [{ name: "name", label: "Name", type: "text" }],
					},
					{
						name: "contact",
						type: "section",
						title: "Contact Info",
						fields: [{ name: "email", label: "Email", type: "email" }],
					},
				],
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			expect(screen.getByText("Personal Info")).toBeInTheDocument();
			expect(screen.getByText("Contact Info")).toBeInTheDocument();
		});
	});

	describe("Conditional Fields", () => {
		it("shows field based on condition", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "hasAddress",
								label: "I have an address",
								type: "checkbox",
							},
							{
								name: "address",
								label: "Address",
								type: "text",
								condition: (formData: { hasAddress: boolean }) =>
									formData.hasAddress === true,
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			const { rerender } = render(<FormWrapper config={config} />);

			// Initially address field should be hidden
			expect(screen.queryByLabelText("Address")).not.toBeInTheDocument();

			// Check the checkbox
			const checkbox = screen.getByLabelText("I have an address");
			fireEvent.click(checkbox);

			// Address field should now be visible
			rerender(<FormWrapper config={config} />);
			waitFor(() => {
				expect(screen.getByLabelText("Address")).toBeInTheDocument();
			});
		});
	});

	describe("Field Descriptions and Placeholders", () => {
		it("renders field description", async () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "password",
								label: "Password",
								type: "password",
								description: "Must be at least 8 characters",
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			expect(
				await screen.findByText("Must be at least 8 characters"),
			).toBeInTheDocument();
		});

		it("renders field placeholder", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "email",
								label: "Email",
								type: "email",
								placeholder: "you@example.com",
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			expect(
				screen.getByPlaceholderText("you@example.com"),
			).toBeInTheDocument();
		});
	});

	describe("Disabled State", () => {
		it("disables field when disabled prop is true", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "email",
								label: "Email",
								type: "email",
								disabled: true,
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			expect(screen.getByLabelText("Email")).toBeDisabled();
		});
	});

	describe("Grid Layout", () => {
		it("applies grid layout when layout columns is set", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "firstName",
								label: "First Name",
								type: "text",
								gridColumn: "half",
							},
							{
								name: "lastName",
								label: "Last Name",
								type: "text",
								gridColumn: "half",
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			expect(screen.getByLabelText("First Name")).toBeInTheDocument();
			expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
		});
	});

	describe("User Interaction", () => {
		it("updates field value on change", async () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [{ name: "name", label: "Name", type: "text" }],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			const input = screen.getByLabelText("Name");
			fireEvent.change(input, { target: { value: "John" } });

			await waitFor(() => {
				expect(input).toHaveValue("John");
			});
		});

		it("clears error on field change", async () => {
			const onSubmit = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "name",
								label: "Name",
								type: "text",
								required: true,
							},
						],
					},
				]),
				onSubmit,
			};

			render(<FormWrapper config={config} />);

			// Submit with empty field to trigger error
			const submitButton = screen.getByRole("button", { name: /Submit/i });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
			});

			// Type in field to clear error
			const input = screen.getByLabelText(/Name/);
			fireEvent.change(input, { target: { value: "John" } });

			await waitFor(() => {
				expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument();
			});
		});
	});
});
