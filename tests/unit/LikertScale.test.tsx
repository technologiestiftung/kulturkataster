import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LikertScale } from "@/components/ui/likert-scale";

const scaleOptions = [
	{ value: "1", label: "sehr instabil" },
	{ value: "2", label: "eher instabil" },
	{ value: "3", label: "teils/teils" },
	{ value: "4", label: "eher stabil" },
	{ value: "5", label: "sehr stabil" },
];

describe("LikertScale", () => {
	it("renders one radio option per entry with its label", () => {
		render(<LikertScale options={scaleOptions} />);

		expect(screen.getAllByRole("radio")).toHaveLength(5);
		scaleOptions.forEach((option) => {
			expect(screen.getByLabelText(option.label)).toBeInTheDocument();
		});
	});

	it("supports a dynamic number of options", () => {
		const { rerender } = render(
			<LikertScale options={scaleOptions.slice(0, 3)} />,
		);
		expect(screen.getAllByRole("radio")).toHaveLength(3);

		rerender(
			<LikertScale
				options={[
					...scaleOptions,
					{ value: "6", label: "extra" },
					{ value: "7", label: "extra 2" },
				]}
			/>,
		);
		expect(screen.getAllByRole("radio")).toHaveLength(7);
	});

	it("calls onValueChange with the selected option's value", () => {
		const onValueChange = vi.fn();
		render(
			<LikertScale options={scaleOptions} onValueChange={onValueChange} />,
		);

		fireEvent.click(screen.getByLabelText("teils/teils"));

		expect(onValueChange).toHaveBeenCalledWith("3");
	});

	it("reflects a controlled value as the checked option", () => {
		render(<LikertScale options={scaleOptions} value="2" />);

		expect(screen.getByLabelText("eher instabil")).toBeChecked();
		expect(screen.getByLabelText("sehr instabil")).not.toBeChecked();
	});

	it("does not render a connecting line for a single option", () => {
		const { container } = render(<LikertScale options={[scaleOptions[0]!]} />);

		expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
	});

	it("renders a connecting line spanning the options", () => {
		const { container } = render(<LikertScale options={scaleOptions} />);

		expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
	});

	it("disables every option when disabled", () => {
		render(<LikertScale options={scaleOptions} disabled />);

		screen.getAllByRole("radio").forEach((radio) => {
			expect(radio).toBeDisabled();
		});
	});

	it("stays a horizontal radio group by default", () => {
		render(<LikertScale options={scaleOptions} />);

		expect(screen.getByRole("radiogroup")).toHaveAttribute(
			"aria-orientation",
			"horizontal",
		);
	});

	it("drops the horizontal orientation when stacked on mobile", () => {
		render(<LikertScale options={scaleOptions} stackOnMobile />);

		expect(screen.getByRole("radiogroup")).not.toHaveAttribute(
			"aria-orientation",
		);
	});

	it("forwards aria-invalid to the radio group", () => {
		render(<LikertScale options={scaleOptions} aria-invalid />);

		expect(screen.getByRole("radiogroup")).toHaveAttribute(
			"aria-invalid",
			"true",
		);
	});
});
