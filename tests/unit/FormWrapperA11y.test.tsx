import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormWrapper } from "@/components/FormWrapper/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper/types";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) =>
			key === "common.form.validation.required" ? "Required" : key,
		i18n: { changeLanguage: () => new Promise(() => {}) },
	}),
}));

const renderForm = (fields: FormWrapperConfig["fields"]) =>
	render(<FormWrapper config={{ fields, onSubmit: vi.fn() }} />);

const submit = () =>
	fireEvent.click(screen.getByRole("button", { name: "common.submit" }));

describe("FormWrapper accessibility", () => {
	it("marks required inputs with aria-required and hides the visual asterisk", () => {
		renderForm([
			{ name: "title", label: "Title", type: "text", required: true },
		]);

		const input = screen.getByRole("textbox", { name: "Title" });
		expect(input).toHaveAttribute("aria-required", "true");
		expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
	});

	it("passes autoComplete through to the input", () => {
		renderForm([
			{ name: "email", label: "E-Mail", type: "email", autoComplete: "email" },
		]);

		expect(screen.getByRole("textbox", { name: "E-Mail" })).toHaveAttribute(
			"autocomplete",
			"email",
		);
	});

	it("links description and error to the input via aria-describedby", async () => {
		renderForm([
			{
				name: "title",
				label: "Title",
				description: "Shown on the map",
				type: "text",
				required: true,
			},
		]);

		const input = screen.getByRole("textbox", { name: "Title" });
		expect(input).toHaveAccessibleDescription("Shown on the map");

		submit();

		await waitFor(() =>
			expect(input).toHaveAccessibleDescription("Shown on the map Required"),
		);
		expect(input).toHaveAttribute("aria-invalid", "true");
	});

	it("moves focus to the first invalid field after a failed submit", async () => {
		renderForm([
			{ name: "first", label: "First", type: "text" },
			{ name: "second", label: "Second", type: "text", required: true },
		]);

		submit();

		await waitFor(() =>
			expect(screen.getByRole("textbox", { name: "Second" })).toHaveFocus(),
		);
		expect(screen.getByRole("status")).toHaveTextContent(
			"common.alert.errorFixFields",
		);
	});

	it("focuses into a radio group when it is the first invalid field", async () => {
		renderForm([
			{
				name: "choice",
				label: "Choice",
				type: "radio",
				required: true,
				options: [
					{ value: "a", label: "A" },
					{ value: "b", label: "B" },
				],
			},
		]);

		submit();

		await waitFor(() =>
			expect(document.activeElement).toHaveAttribute("role", "radio"),
		);
	});

	it("names radio and likert groups by their field label", () => {
		renderForm([
			{
				name: "choice",
				label: "Choice",
				type: "radio",
				required: true,
				options: [{ value: "a", label: "A" }],
			},
			{
				name: "rating",
				label: "Rating",
				type: "likert",
				options: [
					{ value: 1, label: "Low" },
					{ value: 2, label: "High" },
				],
			},
		]);

		const radioGroup = screen.getByRole("radiogroup", { name: "Choice" });
		expect(radioGroup).toHaveAttribute("aria-required", "true");
		expect(
			screen.getByRole("radiogroup", { name: "Rating" }),
		).toBeInTheDocument();
	});

	it("names each likert matrix row by field and row label", () => {
		renderForm([
			{
				name: "matrix",
				label: "Importance",
				type: "likertMatrix",
				likertMatrix: { rows: [{ key: "funding", label: "Funding" }] },
				options: [
					{ value: 1, label: "Low" },
					{ value: 2, label: "High" },
				],
			},
		]);

		expect(
			screen.getByRole("radiogroup", { name: "Importance Funding" }),
		).toBeInTheDocument();
	});

	it("exposes a checkbox multiselect as a named group with sr-only required text", () => {
		renderForm([
			{
				name: "tags",
				label: "Tags",
				type: "multiselect",
				required: true,
				options: [{ value: "x", label: "X" }],
			},
		]);

		expect(
			screen.getByRole("group", {
				name: "Tags common.a11y.forms.required",
			}),
		).toBeInTheDocument();
	});

	it("links a partial date input to its format hint", () => {
		renderForm([{ name: "since", label: "Since", type: "partialDate" }]);

		expect(
			screen.getByRole("textbox", { name: "Since" }),
		).toHaveAccessibleDescription("common.form.validation.invalidPartialDate");
	});
});
