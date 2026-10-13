import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StepDots } from "@/components/HorizontalStepper/StepDots";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>) =>
			((options?.defaultValue as string) ?? key).replace(
				/\{\{(\w+)\}\}/g,
				(_, name: string) => String(options?.[name] ?? ""),
			),
	}),
}));

describe("StepDots", () => {
	it("renders labelled step buttons in a list and marks the current step", () => {
		const onDotClick = vi.fn();
		render(<StepDots total={3} currentIndex={1} onDotClick={onDotClick} />);

		expect(screen.getByRole("navigation")).toBeInTheDocument();
		expect(screen.getAllByRole("listitem")).toHaveLength(3);
		const current = screen.getByRole("button", { name: "Schritt 2 von 3" });
		expect(current).toHaveAttribute("aria-current", "step");
		expect(
			screen.getByRole("button", { name: "Schritt 1 von 3" }),
		).not.toHaveAttribute("aria-current");

		fireEvent.click(screen.getByRole("button", { name: "Schritt 3 von 3" }));
		expect(onDotClick).toHaveBeenCalledWith(2);
	});

	it("uses a custom dot label when provided", () => {
		render(
			<StepDots
				total={2}
				currentIndex={0}
				onDotClick={vi.fn()}
				getDotLabel={(index, total) => `Block ${index + 1}/${total}`}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Block 2/2" }),
		).toBeInTheDocument();
	});

	it("renders a static indicator as a single image with the current position", () => {
		render(<StepDots total={4} currentIndex={2} />);

		expect(
			screen.getByRole("img", { name: "Schritt 3 von 4" }),
		).toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});
