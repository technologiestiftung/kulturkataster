import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CategorySectionList } from "@/components/Filter/CategorySection/CategorySectionList";
import type { Category, FilterState } from "@/types";

vi.mock("react-i18next", () => ({
	useTranslation: (_ns?: string | string[]) => ({
		t: (key: string) => key,
		i18n: { language: "de" },
	}),
}));

vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (
		selector: (state: {
			categoryCounts: Record<string, number>;
			subcategoryCounts: Record<string, number>;
		}) => unknown,
	) =>
		selector({
			categoryCounts: {},
			subcategoryCounts: {},
		}),
}));

vi.mock("@/components/shared/CategoryIcon", () => ({
	CategoryIcon: () => <div data-testid="category-icon" />,
}));

const leafCategory: Category = {
	id: 1,
	key: "leaf_category",
	child_categories: [],
};

function CategorySectionListHarness() {
	const [filters, setFilters] = useState<FilterState>({
		district_keys: [],
		category_keys: [],
		child_category_keys: [],
		include_closed: false,
		status: undefined,
	});

	return (
		<CategorySectionList
			filters={filters}
			categoryGroups={[leafCategory]}
			onFiltersChange={setFilters}
			categorySectionMode="selection"
		/>
	);
}

describe("CategorySectionList", () => {
	it("allows selecting and deselecting a leaf category in selection mode", () => {
		render(<CategorySectionListHarness />);

		const checkbox = screen.getByRole("checkbox", {
			name: "category.leaf_category",
		});

		expect(checkbox).toHaveAttribute("aria-checked", "false");

		fireEvent.click(checkbox);
		expect(checkbox).toHaveAttribute("aria-checked", "true");

		fireEvent.click(checkbox);
		expect(checkbox).toHaveAttribute("aria-checked", "false");
	});
});
