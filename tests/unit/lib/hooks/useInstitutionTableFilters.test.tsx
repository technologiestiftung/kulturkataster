import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useInstitutionTableFilters } from "@/lib/hooks/useInstitutionTableFilters";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import type { Category } from "@/types/category";
import type { InstitutionTableRow } from "@/types/institution";

const initialInstitutionState = useInstitutionStore.getState();

afterEach(() => {
	useInstitutionStore.setState(initialInstitutionState, true);
});

const rowWithDistrict = (id: number, district: string | null) =>
	({ id, address: { id, district } }) as unknown as InstitutionTableRow;

describe("useInstitutionTableFilters", () => {
	it("offers public districts when the user has no rows of their own", () => {
		useInstitutionStore.setState({ districts: ["Pankow", "Mitte"] });

		const { result } = renderHook(() => useInstitutionTableFilters([], []));

		expect(result.current.districts).toEqual(["Mitte", "Pankow"]);
	});

	it("merges row districts with public districts without duplicates", () => {
		useInstitutionStore.setState({ districts: ["Mitte"] });

		const { result } = renderHook(() =>
			useInstitutionTableFilters(
				[
					rowWithDistrict(1, "Spandau"),
					rowWithDistrict(2, "Mitte"),
					rowWithDistrict(3, null),
				],
				[],
			),
		);

		expect(result.current.districts).toEqual(["Mitte", "Spandau"]);
	});

	it("reports zero category counts when the user has no rows", () => {
		const categoryGroups = [
			{
				id: 1,
				key: "cinemas",
				child_categories: [{ id: 2, key: "arthouse", parent_category_id: 1 }],
			},
		] as unknown as Category[];

		const { result } = renderHook(() =>
			useInstitutionTableFilters([], categoryGroups),
		);

		expect(result.current.categoryCounts).toEqual({ cinemas: 0 });
		expect(result.current.subcategoryCounts).toEqual({ arthouse: 0 });
	});
});
