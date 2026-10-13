import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilterButtonWithCount } from "@/components/Filter/FilterButtonWithCount";

const { filtersMock } = vi.hoisted(() => ({
	filtersMock: {
		current: {
			district_keys: [] as string[],
			category_keys: [] as string[],
			child_category_keys: [] as string[],
			culture_index_ranges: [] as string[],
			include_closed: false,
		},
	},
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>) =>
			key === "common.a11y.map.filterButtonActive"
				? `${options?.label}, ${options?.count} aktiv`
				: key,
	}),
}));

vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (
		selector: (state: { filters: typeof filtersMock.current }) => unknown,
	) => selector({ filters: filtersMock.current }),
}));

vi.mock("@/icons/filter.svg", () => ({
	default: () => <span aria-hidden="true" />,
}));

describe("FilterButtonWithCount", () => {
	it("is named by its tooltip text when no filter is active", () => {
		filtersMock.current = { ...filtersMock.current, district_keys: [] };
		render(<FilterButtonWithCount tooltip="Kulturorte filtern" />);

		expect(
			screen.getByRole("button", { name: "Kulturorte filtern" }),
		).toBeInTheDocument();
	});

	it("includes the active filter count in its accessible name", () => {
		filtersMock.current = {
			...filtersMock.current,
			district_keys: ["Mitte", "Pankow"],
			include_closed: true,
		};
		render(<FilterButtonWithCount tooltip="Kulturorte filtern" />);

		expect(
			screen.getByRole("button", { name: "Kulturorte filtern, 3 aktiv" }),
		).toBeInTheDocument();
		expect(screen.getByText("3")).toHaveAttribute("aria-hidden", "true");
	});
});
