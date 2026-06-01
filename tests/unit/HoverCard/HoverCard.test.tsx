import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HoverCard from "@/components/HoverCard/HoverCard";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

vi.mock("@/lib/hooks/useFieldLabel", () => ({
	useFieldLabel: () => (key: string) => key,
}));

vi.mock("@/components/shared/CategoryIcon", () => ({
	CategoryIcon: () => null,
}));

const createFeature = (properties: Record<string, unknown>) => ({
	getProperties: () => properties,
});

describe("HoverCard", () => {
	it("uses the shared known-status color for temporarily closed institutions", () => {
		render(
			<HoverCard
				features={createFeature({
					name: "Temporarily Closed Venue",
					categories: [],
					subcategories: [],
					utilization_status: "temporarily_closed",
				})}
			/>,
		);

		const statusLabel = screen.getByText("utilization_status:");
		const footer = statusLabel.closest(".rounded-b-md");

		expect(footer).toHaveClass("bg-chart-2");
		expect(footer).not.toHaveClass("bg-alert");
	});
});
