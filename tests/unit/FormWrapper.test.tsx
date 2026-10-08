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
		t: (key: string) => {
			const normalizedKey = key.replace(/^common\./, "");

			if (normalizedKey === "form.validation.required") {
				return "Required";
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

		it("supports drag and drop ordering for field permission rows", () => {
			const onReorderFields = vi.fn();
			const dataTransfer = {
				value: "",
				effectAllowed: "",
				dropEffect: "",
				setData: vi.fn((_type: string, value: string) => {
					dataTransfer.value = value;
				}),
				getData: vi.fn(() => dataTransfer.value),
			};
			const config: FormWrapperConfig = {
				fields: [
					{
						name: "fieldPermissions",
						label: "Field permissions",
						type: "fieldPermissions",
						fieldPermissions: {
							reorderable: true,
							onReorderFields,
							sections: [
								{
									id: "institution",
									title: "Institution",
									fields: [
										{ key: "name", label: "Name" },
										{ key: "email", label: "Email" },
									],
								},
							],
						},
					},
				],
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			const nameRow = screen.getByText("Name").closest("tr");
			const emailRow = screen.getByText("Email").closest("tr");
			expect(nameRow).not.toBeNull();
			expect(emailRow).not.toBeNull();

			fireEvent.dragStart(nameRow as HTMLTableRowElement, { dataTransfer });
			fireEvent.dragOver(emailRow as HTMLTableRowElement, { dataTransfer });
			fireEvent.drop(emailRow as HTMLTableRowElement, { dataTransfer });

			expect(onReorderFields).toHaveBeenCalledWith("all", [
				{ key: "email", label: "Email" },
				{ key: "name", label: "Name" },
			]);
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

		it("only shows the radio free-text input while its option is selected", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "referral",
								label: "How did you hear about us?",
								type: "radio",
								options: [
									{ value: "friend", label: "Friend" },
									{ value: "other", label: "Other" },
								],
								freeTextOption: {
									value: "other",
									placeholder: "Please specify",
								},
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			expect(
				screen.queryByPlaceholderText("Please specify"),
			).not.toBeInTheDocument();

			fireEvent.click(screen.getByLabelText("Other"));
			expect(screen.getByPlaceholderText("Please specify")).toBeInTheDocument();

			fireEvent.click(screen.getByLabelText("Friend"));
			expect(
				screen.queryByPlaceholderText("Please specify"),
			).not.toBeInTheDocument();
		});

		it("centers the row only for the option whose free-text input is showing", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "referral",
								label: "How did you hear about us?",
								type: "radio",
								options: [
									{ value: "friend", label: "Friend" },
									{ value: "other", label: "Other" },
								],
								freeTextOption: {
									value: "other",
									placeholder: "Please specify",
								},
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			const friendRadio = screen.getByRole("radio", { name: "Friend" });
			const otherRadio = screen.getByRole("radio", { name: "Other" });
			expect(friendRadio.closest("div")?.className).toContain("items-start");
			expect(otherRadio.closest("div")?.className).toContain("items-start");

			fireEvent.click(otherRadio);

			expect(friendRadio.closest("div")?.className).toContain("items-start");
			expect(otherRadio.closest("div")?.className).toContain("items-center");
		});

		it("submits the typed free text alongside the selected radio option", async () => {
			const onSubmit = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "referral",
								label: "How did you hear about us?",
								type: "radio",
								options: [
									{ value: "friend", label: "Friend" },
									{ value: "other", label: "Other" },
								],
								freeTextOption: {
									value: "other",
									fieldName: "referralOther",
									placeholder: "Please specify",
								},
							},
						],
					},
				]),
				onSubmit,
			};

			render(<FormWrapper config={config} />);
			fireEvent.click(screen.getByLabelText("Other"));
			fireEvent.change(screen.getByPlaceholderText("Please specify"), {
				target: { value: "Newsletter" },
			});
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));

			await waitFor(() => {
				expect(onSubmit).toHaveBeenCalledWith({
					referral: "other",
					referralOther: "Newsletter",
				});
			});
		});

		it("renders likert scale with options", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "stability",
								label: "Stability",
								type: "likert",
								options: [
									{ value: "1", label: "sehr instabil" },
									{ value: "2", label: "eher instabil" },
									{ value: "3", label: "teils/teils" },
									{ value: "4", label: "eher stabil" },
									{ value: "5", label: "sehr stabil" },
								],
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			expect(screen.getByLabelText("sehr instabil")).toBeInTheDocument();
			expect(screen.getByLabelText("teils/teils")).toBeInTheDocument();
			expect(screen.getByLabelText("sehr stabil")).toBeInTheDocument();
		});

		it("wraps rather than restyles the RadioGroup on error, so the connecting line stays aligned", async () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "stability",
								label: "Stability",
								type: "likert",
								required: true,
								options: [
									{ value: "1", label: "sehr instabil" },
									{ value: "2", label: "sehr stabil" },
								],
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));

			const radioGroup = await screen.findByRole("radiogroup");
			await waitFor(() => {
				expect(radioGroup).toHaveAttribute("aria-invalid", "true");
			});
			// The error border/padding must live on a wrapper, not on the RadioGroup
			// itself — LikertScale's connecting line is absolutely positioned relative
			// to the RadioGroup's own (unpadded) box, so padding added directly to it
			// shifts the radio buttons without moving the line.
			expect(radioGroup).not.toHaveClass("p-3");
			expect(radioGroup.parentElement).toHaveClass("p-3");
		});

		it("submits the selected likert value", async () => {
			const onSubmit = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "stability",
								label: "Stability",
								type: "likert",
								options: [1, 2, 3, 4, 5].map((n) => ({
									value: n,
									label: `Option ${n}`,
								})),
							},
						],
					},
				]),
				onSubmit,
			};

			render(<FormWrapper config={config} />);
			fireEvent.click(screen.getByLabelText("Option 4"));
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));

			await waitFor(() => {
				expect(onSubmit).toHaveBeenCalledWith({ stability: 4 });
			});
		});

		it("renders one likert scale per row for a likertMatrix field", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "funding_importance",
								label: "Bedeutung der Finanzierungsquellen",
								type: "likertMatrix",
								options: [
									{ value: "5", label: "hohe Bedeutung" },
									{ value: "1", label: "keine Bedeutung" },
								],
								likertMatrix: {
									rows: [
										{ key: "public_funding", label: "öffentliche Förderung" },
										{ key: "donations", label: "Spenden" },
									],
								},
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			expect(screen.getByText("öffentliche Förderung")).toBeInTheDocument();
			expect(screen.getByText("Spenden")).toBeInTheDocument();
			expect(screen.getAllByText("hohe Bedeutung")).toHaveLength(2);
			// Each row stacks on mobile like a single likert field, so its radio
			// group is not locked to horizontal arrow-key navigation.
			for (const row of screen.getAllByRole("radiogroup")) {
				expect(row).not.toHaveAttribute("aria-orientation");
			}
		});

		it("submits an object keyed by row for a likertMatrix field", async () => {
			const onSubmit = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "funding_importance",
								label: "Bedeutung der Finanzierungsquellen",
								type: "likertMatrix",
								options: [
									{ value: "5", label: "hohe Bedeutung" },
									{ value: "1", label: "keine Bedeutung" },
								],
								likertMatrix: {
									rows: [
										{ key: "public_funding", label: "öffentliche Förderung" },
										{ key: "donations", label: "Spenden" },
									],
								},
							},
						],
					},
				]),
				onSubmit,
			};

			render(<FormWrapper config={config} />);
			const highValueOptions = screen.getAllByLabelText("hohe Bedeutung");
			fireEvent.click(highValueOptions[0]);
			const lowValueOptions = screen.getAllByLabelText("keine Bedeutung");
			fireEvent.click(lowValueOptions[1]);
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));

			await waitFor(() => {
				expect(onSubmit).toHaveBeenCalledWith({
					funding_importance: { public_funding: "5", donations: "1" },
				});
			});
		});

		it("prevents submit for a required likertMatrix field until every row is answered", async () => {
			const onSubmit = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "funding_importance",
								label: "Bedeutung der Finanzierungsquellen",
								type: "likertMatrix",
								required: true,
								options: [
									{ value: "5", label: "hohe Bedeutung" },
									{ value: "1", label: "keine Bedeutung" },
								],
								likertMatrix: {
									rows: [
										{ key: "public_funding", label: "öffentliche Förderung" },
										{ key: "donations", label: "Spenden" },
									],
								},
							},
						],
					},
				]),
				onSubmit,
			};

			render(<FormWrapper config={config} />);
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));
			expect(onSubmit).not.toHaveBeenCalled();
			expect(screen.getByText("Required")).toBeInTheDocument();

			fireEvent.click(screen.getAllByLabelText("hohe Bedeutung")[0]);
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));
			expect(onSubmit).not.toHaveBeenCalled();

			fireEvent.click(screen.getAllByLabelText("keine Bedeutung")[1]);
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));

			await waitFor(() => {
				expect(onSubmit).toHaveBeenCalledWith({
					funding_importance: { public_funding: "5", donations: "1" },
				});
			});
		});

		it("marks only the unanswered rows of a required likertMatrix field as invalid", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "funding_importance",
								label: "Bedeutung der Finanzierungsquellen",
								type: "likertMatrix",
								required: true,
								options: [
									{ value: "5", label: "hohe Bedeutung" },
									{ value: "1", label: "keine Bedeutung" },
								],
								likertMatrix: {
									rows: [
										{ key: "public_funding", label: "öffentliche Förderung" },
										{ key: "donations", label: "Spenden" },
									],
								},
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			fireEvent.click(screen.getAllByLabelText("hohe Bedeutung")[0]);
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));

			const [answeredRow, unansweredRow] = screen.getAllByRole("radiogroup");
			expect(answeredRow).not.toHaveAttribute("aria-invalid");
			expect(unansweredRow).toHaveAttribute("aria-invalid", "true");
		});

		it("keeps the remaining rows invalid when one row is answered after a failed submit", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "funding_importance",
								label: "Bedeutung der Finanzierungsquellen",
								type: "likertMatrix",
								required: true,
								options: [
									{ value: "5", label: "hohe Bedeutung" },
									{ value: "1", label: "keine Bedeutung" },
								],
								likertMatrix: {
									rows: [
										{ key: "public_funding", label: "öffentliche Förderung" },
										{ key: "donations", label: "Spenden" },
										{ key: "sponsoring", label: "Sponsoring" },
									],
								},
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));
			fireEvent.click(screen.getAllByLabelText("hohe Bedeutung")[0]);

			const [answeredRow, ...unansweredRows] =
				screen.getAllByRole("radiogroup");
			expect(answeredRow).not.toHaveAttribute("aria-invalid");
			for (const row of unansweredRows) {
				expect(row).toHaveAttribute("aria-invalid", "true");
			}
			expect(screen.getByText("Required")).toBeInTheDocument();
		});

		it("flags a required field that only appears after a failed submit", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "room_usage",
								label: "Raumnutzung",
								type: "radio",
								required: true,
								options: [
									{ value: "ownership", label: "Eigentum" },
									{ value: "rent", label: "Miete" },
								],
							},
							{
								name: "notice_period",
								label: "Kündigungsfrist",
								type: "text",
								required: true,
								condition: (formData: Record<string, unknown>) =>
									formData.room_usage === "rent",
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));
			fireEvent.click(screen.getByLabelText("Miete"));

			expect(screen.getByRole("textbox")).toHaveAttribute(
				"aria-invalid",
				"true",
			);
		});

		it("does not live-validate after a successful submit", async () => {
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
			const input = screen.getByRole("textbox");
			fireEvent.change(input, { target: { value: "Kulturhaus" } });
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));
			await waitFor(() => expect(onSubmit).toHaveBeenCalled());

			fireEvent.change(input, { target: { value: "" } });

			expect(input).not.toHaveAttribute("aria-invalid");
			expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
		});

		it("clears a blurred field's error on change before any submit", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{ name: "email", label: "Email", type: "email" },
							{ name: "name", label: "Name", type: "text", required: true },
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			const emailInput = screen.getByLabelText("Email");
			fireEvent.change(emailInput, { target: { value: "kultur" } });
			fireEvent.blur(emailInput);
			expect(emailInput).toHaveAttribute("aria-invalid", "true");

			fireEvent.change(emailInput, { target: { value: "kultur@" } });
			expect(emailInput).not.toHaveAttribute("aria-invalid");

			const nameInput = screen.getByLabelText(/Name/);
			fireEvent.change(nameInput, { target: { value: "x" } });
			fireEvent.change(nameInput, { target: { value: "" } });
			expect(nameInput).not.toHaveAttribute("aria-invalid");
		});

		it("clears only the fixed field's error after a failed submit and then submits", async () => {
			const onSubmit = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{ name: "name", label: "Name", type: "text", required: true },
							{
								name: "agree",
								label: "Agree",
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
			expect(screen.getByText("Name is required")).toBeInTheDocument();
			expect(
				screen.getByText("I agree to terms is required"),
			).toBeInTheDocument();

			fireEvent.change(screen.getByRole("textbox"), {
				target: { value: "Kulturhaus" },
			});
			expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
			expect(
				screen.getByText("I agree to terms is required"),
			).toBeInTheDocument();
			expect(onSubmit).not.toHaveBeenCalled();

			fireEvent.click(screen.getByRole("checkbox"));
			expect(
				screen.queryByText("I agree to terms is required"),
			).not.toBeInTheDocument();
			fireEvent.click(screen.getByRole("button", { name: /Submit/i }));
			await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		});

		it("shows a free-text input for a checked multiselect option with freeTextOption", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "channels",
								label: "Digitale Kanäle",
								type: "multiselect",
								options: [
									{ value: "website", label: "eigene Webseite" },
									{ value: "other", label: "Sonstige" },
								],
								freeTextOption: {
									value: "other",
									placeholder: "Bitte angeben",
								},
							},
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);
			expect(
				screen.queryByPlaceholderText("Bitte angeben"),
			).not.toBeInTheDocument();

			const checkbox = screen.getByRole("checkbox", { name: "Sonstige" });
			fireEvent.click(checkbox);
			expect(screen.getByPlaceholderText("Bitte angeben")).toBeInTheDocument();

			fireEvent.click(checkbox);
			expect(
				screen.queryByPlaceholderText("Bitte angeben"),
			).not.toBeInTheDocument();
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

		it("renders no empty header cell for a field without label, description or private note", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{ name: "city", label: "City", type: "text" },
							{ name: "agree", label: "I agree to terms", type: "checkbox" },
						],
					},
				]),
				onSubmit: vi.fn(),
			};

			render(<FormWrapper config={config} />);

			const cityRoot = screen
				.getByRole("textbox")
				.closest(".grid-rows-subgrid");
			expect(cityRoot?.children).toHaveLength(2);
			expect(cityRoot?.children[0]?.className).toContain("self-end");
			expect(cityRoot?.children[1]?.className).not.toContain("row-span-2");

			const checkboxRoot = screen
				.getByRole("checkbox")
				.closest(".grid-rows-subgrid");
			expect(checkboxRoot?.children).toHaveLength(1);
			expect(checkboxRoot?.children[0]?.className).toContain("row-span-2");
		});

		it("holds every field subgrid wrapper to a single shrinkable column", () => {
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [{ name: "city", label: "City", type: "text" }],
					},
				]),
				onSubmit: vi.fn(),
			};

			const { container } = render(<FormWrapper config={config} />);

			const wrappers = Array.from(
				container.querySelectorAll(".grid-rows-subgrid"),
			).filter((element) => element.contains(screen.getByRole("textbox")));
			expect(wrappers).toHaveLength(3);
			for (const wrapper of wrappers) {
				expect(wrapper.classList).toContain("grid-cols-1");
				expect(wrapper.classList).toContain("min-w-0");
			}
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

		it("ignores a second submit fired while the first onSubmit call is still pending", async () => {
			let resolveSubmit: (() => void) | undefined;
			const onSubmit = vi.fn(
				() =>
					new Promise<void>((resolve) => {
						resolveSubmit = resolve;
					}),
			);
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [{ name: "name", label: "Name", type: "text" }],
					},
				]),
				onSubmit,
			};

			render(<FormWrapper config={config} />);

			const submitButton = screen.getByRole("button", { name: /Submit/i });
			fireEvent.click(submitButton);
			fireEvent.click(submitButton);

			await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

			resolveSubmit?.();
			await waitFor(() => {});

			fireEvent.click(submitButton);
			await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
		});

		it("falls back to the generic required message when no enumMap entry exists for the field", async () => {
			const onSubmit = vi.fn();
			const config: FormWrapperConfig = {
				fields: toFields([
					{
						id: "main",
						fields: [
							{
								name: "since_location_year",
								label:
									"Seit wann befindet sich die Einrichtung am aktuellen Standort?",
								type: "text",
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
				expect(screen.getByText(/^Required$/i)).toBeInTheDocument();
			});
			expect(
				screen.queryByText(/enumMap\.field_names/),
			).not.toBeInTheDocument();
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
