"use client";

import { FC, useId } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { CategorySectionList } from "@/components/Filter/CategorySection/CategorySectionList";
import DistrictTags from "@/components/Filter/DistrictTags/DistrictTags";
import CultureIndexTags from "@/components/Filter/CultureIndexTags/CultureIndexTags";
import { Button } from "@/components/ui/button";
import { FilterPanelSkeleton } from "@/components/Filter/FilterPanelSkeleton";
import EyeOff from "@/icons/eye-off.svg";
import Eye from "@/icons/eye.svg";
import type { Category, FilterState } from "@/types";
import {
	CULTURE_INDEX_RANGES,
	type CultureIndexRangeKey,
} from "@/lib/constants/cultureIndexRanges";
import { cn } from "@/lib/utils";

export type FilterPanelProps = {
	filters: FilterState | null;
	categoryGroups: Category[];
	districts: string[];
	filteredCount?: number;
	categoryCounts?: Record<string, number>;
	subcategoryCounts?: Record<string, number>;
	cultureIndexRangeCounts?: Record<CultureIndexRangeKey, number>;
	loading?: boolean;
	error?: string | null;
	onRetry?: () => void;
	onFiltersChange: (nextFilters: FilterState) => void;
	showSummary?: boolean;
	showCultureIndex?: boolean;
	showDistricts?: boolean;
	showClosedToggle?: boolean;
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	categorySectionMode?: "filter" | "selection";
	parentCategorySelectionBehavior?:
		| "select-all-children"
		| "parent-only"
		| "last-child-only";
	selectionEmptyLabel?: string;
};

export const FilterPanel: FC<FilterPanelProps> = ({
	filters,
	categoryGroups,
	districts,
	filteredCount = 0,
	categoryCounts,
	subcategoryCounts,
	cultureIndexRangeCounts,
	loading = false,
	error,
	onRetry,
	onFiltersChange,
	showSummary = true,
	showCultureIndex = true,
	showDistricts = true,
	showClosedToggle = true,
	collapsible = false,
	defaultCollapsed = false,
	categorySectionMode = "filter",
	parentCategorySelectionBehavior = "select-all-children",
	selectionEmptyLabel,
}) => {
	const { t } = useTranslation();
	const cultureIndexHeadingId = useId();
	const districtsHeadingId = useId();
	const showCategoryHeader = categorySectionMode !== "selection";

	const updateFilters = (nextFilters: FilterState) => {
		onFiltersChange(nextFilters);
	};

	const toggleDistrict = (districtKey: string) => {
		if (!filters) return;

		const isSelected = filters.district_keys.includes(districtKey);
		const newDistricts = isSelected
			? filters.district_keys.filter((d) => d !== districtKey)
			: [...filters.district_keys, districtKey];

		updateFilters({ ...filters, district_keys: newDistricts });
	};

	const toggleClosedInstitutions = () => {
		if (!filters) return;

		updateFilters({
			...filters,
			include_closed: !filters.include_closed,
		});
	};

	const resetDistrictFilters = () => {
		if (!filters) return;
		updateFilters({
			...filters,
			district_keys: [],
		});
	};

	const setAllDistrictFilters = () => {
		if (!filters) return;
		if (districts.length === 0) return;

		updateFilters({
			...filters,
			district_keys: districts,
		});
	};

	const hasActiveDistrictFilters = () => {
		return filters?.district_keys && filters.district_keys.length > 0;
	};

	const toggleCultureIndexRange = (rangeKey: CultureIndexRangeKey) => {
		if (!filters) return;

		const isSelected = filters.culture_index_ranges.includes(rangeKey);
		const newRanges = isSelected
			? filters.culture_index_ranges.filter((r) => r !== rangeKey)
			: [...filters.culture_index_ranges, rangeKey];

		updateFilters({ ...filters, culture_index_ranges: newRanges });
	};

	const resetCultureIndexFilters = () => {
		if (!filters) return;
		updateFilters({
			...filters,
			culture_index_ranges: [],
		});
	};

	const setAllCultureIndexFilters = () => {
		if (!filters) return;

		updateFilters({
			...filters,
			culture_index_ranges: CULTURE_INDEX_RANGES.map((range) => range.key),
		});
	};

	const hasActiveCultureIndexFilters = () => {
		return (
			filters?.culture_index_ranges && filters.culture_index_ranges.length > 0
		);
	};

	if (loading) {
		return (
			<FilterPanelSkeleton
				showSummary={showSummary}
				showDistricts={showDistricts}
				showClosedToggle={showClosedToggle}
			/>
		);
	}

	if (error) {
		return (
			<div className="Filter-root p-4 h-full">
				<Card variant="filter">
					<div className="body2 text-alert mb-2">
						{t("content.filter.error")}
					</div>
					{onRetry && (
						<Button size="sm" radius="md" onClick={onRetry}>
							{t("content.filter.retry")}
						</Button>
					)}
				</Card>
			</div>
		);
	}

	const rootClassName = collapsible
		? "Filter-root flex flex-col gap-2"
		: "Filter-root h-full flex flex-col gap-2";

	return (
		<div className={cn(rootClassName, "overflow-auto")}>
			{showSummary && (
				<Card variant="filter">
					<h2 className="body2 font-bold mb-3 pl-2">
						{t("content.filter.displayedInstitutions", {
							count: filteredCount,
						})}
					</h2>
					{showClosedToggle && (
						<button
							type="button"
							className="flex items-center gap-2 transition-opacity body2 text-primary-dark"
							onClick={toggleClosedInstitutions}
						>
							{filters?.include_closed ? (
								<EyeOff className="size-6" aria-hidden="true" />
							) : (
								<Eye className="size-6" aria-hidden="true" />
							)}
							<strong className="body2 font-bold">
								{filters?.include_closed
									? t("content.filter.hideClosed")
									: t("content.filter.showClosed")}
							</strong>
						</button>
					)}
				</Card>
			)}

			{showCultureIndex && (
				<Card variant="filter">
					<div className="flex items-center justify-between mb-4">
						<h3
							id={cultureIndexHeadingId}
							className="body1 font-bold capitalize"
						>
							{t("content.filter.cultureIndex.title")}
						</h3>
						<button
							type="button"
							className="body2 font-light underline"
							onClick={
								hasActiveCultureIndexFilters()
									? resetCultureIndexFilters
									: setAllCultureIndexFilters
							}
						>
							{hasActiveCultureIndexFilters()
								? t("content.filter.cultureIndex.resetFilters")
								: t("content.filter.cultureIndex.setAllFilters")}
						</button>
					</div>
					<CultureIndexTags
						selected={filters?.culture_index_ranges || []}
						onChange={toggleCultureIndexRange}
						counts={cultureIndexRangeCounts}
						labelledBy={cultureIndexHeadingId}
					/>
				</Card>
			)}
			{showDistricts && (
				<Card variant="filter">
					<div className="flex items-center justify-between mb-4">
						<h3 id={districtsHeadingId} className="body1 font-bold capitalize">
							{t("content.filter.districts.title")}
						</h3>
						<button
							type="button"
							className="body2 font-light underline"
							onClick={
								hasActiveDistrictFilters()
									? resetDistrictFilters
									: setAllDistrictFilters
							}
						>
							{hasActiveDistrictFilters()
								? t("content.filter.districts.resetFilters")
								: t("content.filter.districts.setAllFilters")}
						</button>
					</div>
					<DistrictTags
						districts={districts}
						selected={filters?.district_keys || []}
						onChange={toggleDistrict}
						labelledBy={districtsHeadingId}
					/>
				</Card>
			)}

			<CategorySectionList
				filters={filters}
				categoryGroups={categoryGroups}
				categoryCounts={categoryCounts}
				subcategoryCounts={subcategoryCounts}
				onFiltersChange={onFiltersChange}
				collapsible={collapsible}
				defaultCollapsed={defaultCollapsed}
				categorySectionMode={categorySectionMode}
				parentCategorySelectionBehavior={parentCategorySelectionBehavior}
				selectionEmptyLabel={selectionEmptyLabel}
				showHeader={showCategoryHeader}
			/>
		</div>
	);
};
