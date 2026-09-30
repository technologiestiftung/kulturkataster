"use client";

import { useMemo, useState } from "react";
import type { FilterState, Institution } from "@/types";
import type { InstitutionTableRow } from "@/types/institution";
import type { Category } from "@/types/category";
import {
	getParentCategories,
	getSubcategories,
} from "@/lib/utils/institutionUtils";
import { defaultTableFilterState } from "@/components/FormWrapper/constants";
import { useAccountStore } from "@/lib/store/accountStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { isSubmissionRow } from "@/lib/utils/institutionTableUtils";
import {
	createEmptyCultureIndexRangeCounts,
	getCultureIndexRangeForValue,
} from "@/lib/constants/cultureIndexRanges";

const matchesCultureIndexRangeFilter = (
	value: number | null | undefined,
	rangeKeys: FilterState["culture_index_ranges"],
): boolean => {
	if (rangeKeys.length === 0) return true;
	const range = getCultureIndexRangeForValue(value);
	return range !== null && rangeKeys.includes(range);
};

export function useInstitutionTableFilters(
	tableRows: InstitutionTableRow[],
	filterCategoryGroups: Category[],
) {
	const [filters, setFilters] = useState<FilterState>(defaultTableFilterState);

	// Public districts keep the filter populated for roles that only see their
	// own rows (e.g. guests); row districts cover drafts and private places.
	const publicDistricts = useInstitutionStore((state) => state.districts);
	const districts = useMemo(
		() =>
			Array.from(
				new Set(
					[
						...publicDistricts,
						...tableRows.map((row) => row.address?.district),
					].filter(
						(district): district is string =>
							typeof district === "string" && district.trim().length > 0,
					),
				),
			).sort((a, b) => a.localeCompare(b)),
		[publicDistricts, tableRows],
	);

	const filteredTableRows = useMemo(() => {
		return tableRows.filter((row) => {
			if (
				!filters.include_closed &&
				row.utilization_status === "permanently_closed"
			) {
				return false;
			}

			if (
				filters.district_keys.length > 0 &&
				(!row.address?.district ||
					!filters.district_keys.includes(row.address.district))
			) {
				return false;
			}

			if (
				!matchesCultureIndexRangeFilter(
					row.culture_index,
					filters.culture_index_ranges,
				)
			) {
				return false;
			}

			const hasCategoryFilters =
				filters.category_keys.length > 0 ||
				filters.child_category_keys.length > 0;

			if (!hasCategoryFilters) return true;

			const parentMatches = getParentCategories(
				row as Partial<Institution>,
			).some((category) => filters.category_keys.includes(category.key));

			const subcategoryMatches = getSubcategories(
				row as Partial<Institution>,
			).some((subcategory) =>
				filters.child_category_keys.includes(subcategory.key),
			);

			return parentMatches || subcategoryMatches;
		});
	}, [filters, tableRows]);

	const { categoryCounts, subcategoryCounts } = useMemo(() => {
		const counts = {
			categoryCounts: {} as Record<string, number>,
			subcategoryCounts: {} as Record<string, number>,
		};

		if (filterCategoryGroups.length === 0 || tableRows.length === 0) {
			return counts;
		}

		filterCategoryGroups.forEach((category) => {
			counts.categoryCounts[category.key] = 0;
			(category.child_categories ?? []).forEach((subcategory) => {
				counts.subcategoryCounts[subcategory.key] = 0;
			});
		});

		tableRows.forEach((row) => {
			if (
				!filters.include_closed &&
				row.utilization_status === "permanently_closed"
			) {
				return;
			}

			if (
				filters.district_keys.length > 0 &&
				(!row.address?.district ||
					!filters.district_keys.includes(row.address.district))
			) {
				return;
			}

			if (
				!matchesCultureIndexRangeFilter(
					row.culture_index,
					filters.culture_index_ranges,
				)
			) {
				return;
			}

			getParentCategories(row as Partial<Institution>).forEach((category) => {
				if (
					Object.prototype.hasOwnProperty.call(
						counts.categoryCounts,
						category.key,
					)
				) {
					counts.categoryCounts[category.key] += 1;
				}
			});

			getSubcategories(row as Partial<Institution>).forEach((subcategory) => {
				if (
					Object.prototype.hasOwnProperty.call(
						counts.subcategoryCounts,
						subcategory.key,
					)
				) {
					counts.subcategoryCounts[subcategory.key] += 1;
				}
			});
		});

		return counts;
	}, [
		filterCategoryGroups,
		filters.district_keys,
		filters.include_closed,
		filters.culture_index_ranges,
		tableRows,
	]);

	const cultureIndexRangeCounts = useMemo(() => {
		const counts = createEmptyCultureIndexRangeCounts();

		tableRows.forEach((row) => {
			if (
				!filters.include_closed &&
				row.utilization_status === "permanently_closed"
			) {
				return;
			}

			if (
				filters.district_keys.length > 0 &&
				(!row.address?.district ||
					!filters.district_keys.includes(row.address.district))
			) {
				return;
			}

			const hasCategoryFilters =
				filters.category_keys.length > 0 ||
				filters.child_category_keys.length > 0;

			if (hasCategoryFilters) {
				const parentMatches = getParentCategories(
					row as Partial<Institution>,
				).some((category) => filters.category_keys.includes(category.key));
				const subcategoryMatches = getSubcategories(
					row as Partial<Institution>,
				).some((subcategory) =>
					filters.child_category_keys.includes(subcategory.key),
				);
				if (!parentMatches && !subcategoryMatches) return;
			}

			const range = getCultureIndexRangeForValue(row.culture_index);
			if (range) counts[range] += 1;
		});

		return counts;
	}, [
		filters.district_keys,
		filters.include_closed,
		filters.category_keys,
		filters.child_category_keys,
		tableRows,
	]);

	const institutions = useAccountStore((s) => s.institutions);
	const downloadableInstitutions = useMemo(() => {
		const visibleInstitutionIds = new Set(
			filteredTableRows
				.filter((row) => !isSubmissionRow(row))
				.map((row) => row.id),
		);
		return institutions.filter((institution) =>
			visibleInstitutionIds.has(institution.id),
		);
	}, [filteredTableRows, institutions]);

	return {
		filters,
		setFilters,
		districts,
		filteredTableRows,
		categoryCounts,
		subcategoryCounts,
		cultureIndexRangeCounts,
		downloadableInstitutions,
	};
}
