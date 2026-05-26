"use client";

import { FC } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { CategorySectionList } from "@/components/Filter/CategorySection/CategorySectionList";
import DistrictTags from "@/components/Filter/DistrictTags/DistrictTags";
import { Button } from "@/components/ui/button";
import { FilterPanelSkeleton } from "@/components/Filter/FilterPanelSkeleton";
import EyeOff from "@/icons/eye-off.svg";
import Eye from "@/icons/eye.svg";
import type { Category, FilterState } from "@/types";
import { cn } from "@/lib/utils";

export type FilterPanelProps = {
	filters: FilterState | null;
	categoryGroups: Category[];
	districts: string[];
	filteredCount?: number;
	categoryCounts?: Record<string, number>;
	subcategoryCounts?: Record<string, number>;
	loading?: boolean;
	error?: string | null;
	onRetry?: () => void;
	onFiltersChange: (nextFilters: FilterState) => void;
	showSummary?: boolean;
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
	loading = false,
	error,
	onRetry,
	onFiltersChange,
	showSummary = true,
	showDistricts = true,
	showClosedToggle = true,
	collapsible = false,
	defaultCollapsed = false,
	categorySectionMode = "filter",
	parentCategorySelectionBehavior = "select-all-children",
	selectionEmptyLabel,
}) => {
	const { t } = useTranslation(["content", "common"]);
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
						{t("filter.error", { ns: "content" })}
					</div>
					{onRetry && (
						<Button size="sm" radius="md" onClick={onRetry}>
							{t("filter.retry", { ns: "content" })}
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
						{t("filter.displayedInstitutions", {
							ns: "content",
							count: filteredCount,
						})}
					</h2>
					{showClosedToggle && (
						<button
							className="flex items-center gap-2 transition-opacity body2 text-primary-dark"
							onClick={toggleClosedInstitutions}
						>
							{filters?.include_closed ? (
								<EyeOff className="size-6" />
							) : (
								<Eye className="size-6" />
							)}
							<strong className="body2 font-bold">
								{filters?.include_closed
									? t("filter.hideClosed", { ns: "content" })
									: t("filter.showClosed", { ns: "content" })}
							</strong>
						</button>
					)}
				</Card>
			)}

			{showDistricts && (
				<Card variant="filter">
					<div className="flex items-center justify-between mb-4">
						<h3 className="body1 font-bold capitalize">
							{t("filter.districts.title", { ns: "content" })}
						</h3>
						<button
							className="body2 font-light underline"
							onClick={
								hasActiveDistrictFilters()
									? resetDistrictFilters
									: setAllDistrictFilters
							}
						>
							{hasActiveDistrictFilters()
								? t("filter.districts.resetFilters", { ns: "content" })
								: t("filter.districts.setAllFilters", { ns: "content" })}
						</button>
					</div>
					<DistrictTags
						districts={districts}
						selected={filters?.district_keys || []}
						onChange={toggleDistrict}
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
