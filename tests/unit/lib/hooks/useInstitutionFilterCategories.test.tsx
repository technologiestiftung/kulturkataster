import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useInstitutionFilterCategories } from "@/lib/hooks/useInstitutionFilterCategories";
import { useAccountStore } from "@/lib/store/accountStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import type { Category } from "@/types/category";

const initialAccountState = useAccountStore.getState();
const initialInstitutionState = useInstitutionStore.getState();

afterEach(() => {
	useAccountStore.setState(initialAccountState, true);
	useInstitutionStore.setState(initialInstitutionState, true);
});

describe("useInstitutionFilterCategories", () => {
	it("returns account subcategories even when public categories are sparse", () => {
		const accountParent: Category = {
			id: 1,
			key: "account_parent",
			child_categories: [
				{
					id: 2,
					key: "connected_child",
					parent_category_id: 1,
				},
				{
					id: 3,
					key: "unconnected_child",
					parent_category_id: 1,
				},
			],
		};
		const publicParent: Category = {
			id: 1,
			key: "account_parent",
			child_categories: [
				{
					id: 2,
					key: "connected_child",
					parent_category_id: 1,
				},
			],
		};

		useAccountStore.setState({ categories: [accountParent] });
		useInstitutionStore.setState({ categories: [publicParent] });

		const { result } = renderHook(() => useInstitutionFilterCategories());

		expect(result.current.filterCategoryGroups).toHaveLength(1);
		expect(
			result.current.filterCategoryGroups[0].child_categories?.map(
				(category) => category.key,
			),
		).toEqual(["connected_child", "unconnected_child"]);
	});
});
