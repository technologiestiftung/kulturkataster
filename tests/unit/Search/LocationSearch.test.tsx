import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LocationSearch } from "@/components/Search/LocationSearch";
import type { SearchResult } from "@/types/institution";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>) =>
			options?.count !== undefined ? `${key}:${options.count}` : key,
	}),
}));

vi.mock("next/navigation", () => ({
	usePathname: () => "/de/map",
	useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/server/actions/searchLocations", () => ({
	searchLocations: vi.fn(),
}));

vi.mock("@/components/MultiSelect/SelectableOptionsList", () => ({
	SelectableOptionsList: () => <div data-testid="results" />,
}));

vi.mock("@/components/Filter/FilterButtonWithCount", () => ({
	FilterButtonWithCount: () => null,
}));

const geoResult = {
	id: "1",
	place_name: "Mitte, Berlin",
	center: [13.4, 52.52],
} as unknown as SearchResult;

vi.mock("@/icons/close.svg", () => ({
	default: () => <span aria-hidden="true" />,
}));

vi.mock("@/icons/search.svg", () => ({
	default: () => <span aria-hidden="true" />,
}));

describe("LocationSearch", () => {
	it("gives the search input an explicit accessible name", () => {
		render(<LocationSearch searchFunction={async () => []} />);

		expect(
			screen.getByRole("combobox", { name: "common.search.hint" }),
		).toBeInTheDocument();
	});

	it("server-renders no aria-describedby before a message exists", () => {
		// The server id can differ from the client id after hydration, so the
		// input must not reference a message that is not rendered yet.
		const container = document.createElement("div");
		container.innerHTML = renderToString(
			<LocationSearch searchFunction={async () => []} />,
		);

		expect(container.querySelector("input")).not.toHaveAttribute(
			"aria-describedby",
		);
	});

	it("renders a named clear button that empties the query", async () => {
		render(<LocationSearch searchFunction={async () => [geoResult]} />);
		const input = screen.getByRole("combobox");

		fireEvent.change(input, { target: { value: "Mitte" } });

		const clearButton = await screen.findByRole(
			"button",
			{ name: "common.a11y.map.clearSearch" },
			{ timeout: 2000 },
		);
		expect(clearButton).toHaveAttribute("type", "button");
		expect(
			screen.getByText("common.a11y.map.searchResultsFound:1"),
		).toHaveAttribute("aria-live", "polite");

		fireEvent.click(clearButton);
		expect(input).toHaveValue("");
		expect(input).toHaveFocus();
	});

	it("shows and announces a no-results message", async () => {
		render(<LocationSearch searchFunction={async () => []} />);
		const input = screen.getByRole("combobox");

		fireEvent.change(input, { target: { value: "xyz" } });

		await waitFor(
			() =>
				expect(
					screen.getAllByText("common.search.noResultsFound"),
				).toHaveLength(2),
			{ timeout: 2000 },
		);
		const messages = screen.getAllByText("common.search.noResultsFound");
		expect(
			messages.some((el) => el.getAttribute("aria-live") === "polite"),
		).toBe(true);
		expect(input).toHaveAccessibleDescription("common.search.noResultsFound");
	});

	it("shows no message for embedded inputs that do not show results", async () => {
		render(
			<LocationSearch showResults={false} searchFunction={async () => []} />,
		);

		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "xyz" },
		});

		// Only the live region announces; no visible paragraph is rendered.
		const messages = await screen.findAllByText(
			"common.search.noResultsFound",
			{},
			{ timeout: 2000 },
		);
		expect(messages).toHaveLength(1);
		expect(messages[0]).toHaveAttribute("aria-live", "polite");
	});
});
