"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { FilterPanel } from "@/components/Filter/FilterPanel";
import type { Category, FilterState, Institution } from "@/types";
import {
	matchesCategoryFilter,
	matchesCultureIndexFilter,
	matchesDistrictFilter,
	matchesStatusFilter,
	matchesSubcategoryFilter,
} from "@/lib/utils/filterUtils";
import {
	getParentCategories,
	getSubcategories,
} from "@/lib/utils/institutionUtils";
import {
	createEmptyCultureIndexRangeCounts,
	getCultureIndexRangeForValue,
	type CultureIndexRangeKey,
} from "@/lib/constants/cultureIndexRanges";

const DEFAULT_INSTITUTION_FILTERS: FilterState = {
	status: undefined,
	district_keys: [],
	category_keys: [],
	child_category_keys: [],
	culture_index_ranges: [],
	include_closed: false,
};

const filterInstitutions = (
	institutions: Institution[],
	filters: FilterState,
) => {
	const matchesBaseFilters = (institution: Institution) =>
		matchesStatusFilter(institution, filters.include_closed) &&
		matchesDistrictFilter(institution, filters.district_keys) &&
		matchesCultureIndexFilter(institution, filters.culture_index_ranges);

	const matchesCategoryFilters = (institution: Institution) => {
		const hasCategoryFilters =
			filters.category_keys.length > 0 ||
			filters.child_category_keys.length > 0;
		if (!hasCategoryFilters) return true;
		return (
			matchesCategoryFilter(institution, filters.category_keys) ||
			matchesSubcategoryFilter(institution, filters.child_category_keys)
		);
	};

	return institutions.filter(
		(institution) =>
			matchesBaseFilters(institution) && matchesCategoryFilters(institution),
	);
};

const getCategoryCounts = (
	categories: Category[],
	institutions: Institution[],
	filters: Pick<
		FilterState,
		"include_closed" | "district_keys" | "culture_index_ranges"
	>,
) => {
	const counts = {
		categoryCounts: {} as Record<string, number>,
		subcategoryCounts: {} as Record<string, number>,
	};

	if (categories.length === 0 || institutions.length === 0) {
		return counts;
	}

	categories.forEach((category) => {
		counts.categoryCounts[category.key] = 0;
		(category.child_categories || []).forEach((sub) => {
			counts.subcategoryCounts[sub.key] = 0;
		});
	});

	institutions.forEach((institution) => {
		if (
			!matchesStatusFilter(institution, filters.include_closed) ||
			!matchesDistrictFilter(institution, filters.district_keys) ||
			!matchesCultureIndexFilter(institution, filters.culture_index_ranges)
		) {
			return;
		}

		getParentCategories(institution).forEach((category) => {
			if (
				Object.prototype.hasOwnProperty.call(
					counts.categoryCounts,
					category.key,
				)
			) {
				counts.categoryCounts[category.key] += 1;
			}
		});

		getSubcategories(institution).forEach((subcategory) => {
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
};

const getCultureIndexRangeCounts = (
	institutions: Institution[],
	filters: Pick<
		FilterState,
		"include_closed" | "district_keys" | "category_keys" | "child_category_keys"
	>,
): Record<CultureIndexRangeKey, number> => {
	const counts = createEmptyCultureIndexRangeCounts();

	institutions.forEach((institution) => {
		const hasCategoryFilters =
			filters.category_keys.length > 0 ||
			filters.child_category_keys.length > 0;
		const matchesCategoryFilters =
			!hasCategoryFilters ||
			matchesCategoryFilter(institution, filters.category_keys) ||
			matchesSubcategoryFilter(institution, filters.child_category_keys);

		if (
			!matchesStatusFilter(institution, filters.include_closed) ||
			!matchesDistrictFilter(institution, filters.district_keys) ||
			!matchesCategoryFilters
		) {
			return;
		}

		const range = getCultureIndexRangeForValue(institution.culture_index);
		if (range) counts[range] += 1;
	});

	return counts;
};

const buildInstitutionOption = (
	institution: Institution,
	tEnum: (key: string) => string,
) => {
	const parentCategories = getParentCategories(institution);
	const subcategories = getSubcategories(institution);
	const categoryLabels = parentCategories.map(
		(category) => tEnum(`enumMap.category.${category.key}`) || category.key,
	);
	const subcategoryLabels = subcategories.map(
		(subcategory) =>
			tEnum(`enumMap.category.${subcategory.key}`) || subcategory.key,
	);
	const tagNames =
		institution.tags?.map((tag) => tag.name).filter(Boolean) ?? [];
	const addressTokens = [
		institution.address?.street,
		institution.address?.street_number,
		institution.address?.address_suffix,
		institution.address?.zipcode,
		institution.address?.city,
		institution.address?.neighbourhood,
		institution.address?.district,
	].filter(Boolean);
	const searchText = [
		institution.name,
		...addressTokens,
		...categoryLabels,
		...subcategoryLabels,
		...tagNames,
	]
		.filter(Boolean)
		.join(" ");

	return {
		value: String(institution.id),
		label: `${institution.name} (${institution.id})`,
		searchText,
	};
};

type UseInstitutionMultiSelectArgs = {
	institutions: Institution[];
	categories: Category[];
	locale: string;
	tEnum: (key: string) => string;
};

type UseInstitutionMultiSelectResult = {
	institutionFilters: FilterState;
	setInstitutionFilters: (filters: FilterState) => void;
	institutionOptions: ReturnType<typeof buildInstitutionOption>[];
	filteredInstitutionOptions: ReturnType<typeof buildInstitutionOption>[];
	filterPanel: ReactNode;
	filteredCount: number;
	districts: string[];
	categoryCounts: Record<string, number>;
	subcategoryCounts: Record<string, number>;
	cultureIndexRangeCounts: Record<CultureIndexRangeKey, number>;
};

const useInstitutionMultiSelect = ({
	institutions,
	categories,
	locale,
	tEnum,
}: UseInstitutionMultiSelectArgs): UseInstitutionMultiSelectResult => {
	const [institutionFilters, setInstitutionFilters] = useState<FilterState>(
		DEFAULT_INSTITUTION_FILTERS,
	);

	const collator = useMemo(
		() => new Intl.Collator(locale, { numeric: true, sensitivity: "base" }),
		[locale],
	);

	const districts = useMemo(
		() =>
			Array.from(
				new Set(
					institutions
						.map((institution) => institution.address?.district)
						.filter((district): district is string => Boolean(district)),
				),
			).sort((a, b) => collator.compare(a, b)),
		[institutions, collator],
	);

	const filteredInstitutions = useMemo(
		() => filterInstitutions(institutions, institutionFilters),
		[institutions, institutionFilters],
	);

	const { categoryCounts, subcategoryCounts } = useMemo(() => {
		return getCategoryCounts(categories, institutions, {
			include_closed: institutionFilters.include_closed,
			district_keys: institutionFilters.district_keys,
			culture_index_ranges: institutionFilters.culture_index_ranges,
		});
	}, [categories, institutions, institutionFilters]);

	const cultureIndexRangeCounts = useMemo(() => {
		return getCultureIndexRangeCounts(institutions, {
			include_closed: institutionFilters.include_closed,
			district_keys: institutionFilters.district_keys,
			category_keys: institutionFilters.category_keys,
			child_category_keys: institutionFilters.child_category_keys,
		});
	}, [institutions, institutionFilters]);

	const institutionOptions = useMemo(
		() =>
			institutions.map((institution) =>
				buildInstitutionOption(institution, tEnum),
			),
		[institutions, tEnum],
	);

	const filteredInstitutionOptions = useMemo(
		() =>
			filteredInstitutions.map((institution) =>
				buildInstitutionOption(institution, tEnum),
			),
		[filteredInstitutions, tEnum],
	);

	const filterPanel = (
		<FilterPanel
			filters={institutionFilters}
			categoryGroups={categories}
			districts={districts}
			filteredCount={filteredInstitutions.length}
			categoryCounts={categoryCounts}
			subcategoryCounts={subcategoryCounts}
			cultureIndexRangeCounts={cultureIndexRangeCounts}
			onFiltersChange={setInstitutionFilters}
			parentCategorySelectionBehavior="last-child-only"
		/>
	);

	return {
		institutionFilters,
		setInstitutionFilters,
		institutionOptions,
		filteredInstitutionOptions,
		filterPanel,
		filteredCount: filteredInstitutions.length,
		districts,
		categoryCounts,
		subcategoryCounts,
		cultureIndexRangeCounts,
	};
};

export { useInstitutionMultiSelect };
