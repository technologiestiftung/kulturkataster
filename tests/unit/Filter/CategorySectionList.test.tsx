import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CategorySectionList } from "@/components/Filter/CategorySection/CategorySectionList";
import type { Category, FilterState } from "@/types";

vi.mock("react-i18next", () => ({
	useTranslation: (_ns?: string | string[]) => ({
		t: (key: string) =>
			key.startsWith("enumMap.category.") ? key.replace(/^enumMap\./, "") : key,
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

vi.mock("@/icons/minus.svg", () => ({
	default: () => <div data-testid="minus-icon" />,
}));

const leafCategory: Category = {
	id: 1,
	key: "leaf_category",
	child_categories: [],
};

const parentCategory: Category = {
	id: 2,
	key: "parent_category",
	child_categories: [
		{ id: 21, key: "child_category_a" },
		{ id: 22, key: "child_category_b" },
	],
};

function CategorySectionListHarness({
	categoryGroups = [leafCategory],
	parentCategorySelectionBehavior,
	categorySectionMode = "selection",
}: {
	categoryGroups?: Category[];
	parentCategorySelectionBehavior?:
		| "select-all-children"
		| "parent-only"
		| "last-child-only";
	categorySectionMode?: "filter" | "selection";
}) {
	const [filters, setFilters] = useState<FilterState>({
		district_keys: [],
		category_keys: [],
		child_category_keys: [],
		culture_index_ranges: [],
		include_closed: false,
		status: undefined,
	});

	return (
		<CategorySectionList
			filters={filters}
			categoryGroups={categoryGroups}
			onFiltersChange={setFilters}
			categorySectionMode={categorySectionMode}
			parentCategorySelectionBehavior={parentCategorySelectionBehavior}
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

	it("selects all child categories by default when a parent category is clicked", () => {
		render(<CategorySectionListHarness categoryGroups={[parentCategory]} />);

		fireEvent.click(
			screen.getByRole("checkbox", {
				name: "category.parent_category",
			}),
		);

		expect(
			screen.getByRole("checkbox", { name: "category.child_category_a" }),
		).toHaveAttribute("aria-checked", "true");
		expect(
			screen.getByRole("checkbox", { name: "category.child_category_b" }),
		).toHaveAttribute("aria-checked", "true");
	});

	it("renders child categories even when no institution count exists", () => {
		render(
			<CategorySectionListHarness
				categoryGroups={[parentCategory]}
				categorySectionMode="filter"
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", {
				name: /category.parent_category/,
			}),
		);

		expect(
			screen.getByRole("checkbox", { name: "category.child_category_a" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("checkbox", { name: "category.child_category_b" }),
		).toBeInTheDocument();
		expect(screen.getAllByText("(0)")).toHaveLength(3);
	});

	it("can keep child categories unselected when a parent category is clicked", () => {
		render(
			<CategorySectionListHarness
				categoryGroups={[parentCategory]}
				parentCategorySelectionBehavior="parent-only"
			/>,
		);

		fireEvent.click(
			screen.getByRole("checkbox", {
				name: "category.parent_category",
			}),
		);

		expect(
			screen.getByRole("checkbox", { name: "category.child_category_a" }),
		).toHaveAttribute("aria-checked", "false");
		expect(
			screen.getByRole("checkbox", { name: "category.child_category_b" }),
		).toHaveAttribute("aria-checked", "false");
	});

	it("can select only the last child category when a parent category is clicked", () => {
		render(
			<CategorySectionListHarness
				categoryGroups={[parentCategory]}
				parentCategorySelectionBehavior="last-child-only"
			/>,
		);

		fireEvent.click(
			screen.getByRole("checkbox", {
				name: "category.parent_category",
			}),
		);

		expect(
			screen.getByRole("checkbox", { name: "category.child_category_a" }),
		).toHaveAttribute("aria-checked", "false");
		expect(
			screen.getByRole("checkbox", { name: "category.child_category_b" }),
		).toHaveAttribute("aria-checked", "true");
	});

	it("deselects parent and child again when clicking a last-child-only parent twice", () => {
		render(
			<CategorySectionListHarness
				categoryGroups={[parentCategory]}
				parentCategorySelectionBehavior="last-child-only"
			/>,
		);

		const parentCheckbox = screen.getByRole("checkbox", {
			name: "category.parent_category",
		});

		fireEvent.click(parentCheckbox);
		fireEvent.click(parentCheckbox);

		expect(parentCheckbox).toHaveAttribute("aria-checked", "false");
		expect(
			screen.getByRole("checkbox", { name: "category.child_category_a" }),
		).toHaveAttribute("aria-checked", "false");
		expect(
			screen.getByRole("checkbox", { name: "category.child_category_b" }),
		).toHaveAttribute("aria-checked", "false");
	});

	it("deselects the last child again when clicking a last-child-only parent twice in filter mode", () => {
		render(
			<CategorySectionListHarness
				categoryGroups={[parentCategory]}
				categorySectionMode="filter"
				parentCategorySelectionBehavior="last-child-only"
			/>,
		);

		const parentCheckbox = screen.getByRole("checkbox", {
			name: "category.parent_category",
		});

		fireEvent.click(parentCheckbox);
		fireEvent.click(parentCheckbox);

		expect(parentCheckbox).toHaveAttribute("aria-checked", "false");
		expect(
			screen.getByRole("checkbox", { name: "category.child_category_a" }),
		).toHaveAttribute("aria-checked", "false");
		expect(
			screen.getByRole("checkbox", { name: "category.child_category_b" }),
		).toHaveAttribute("aria-checked", "false");
	});
});
