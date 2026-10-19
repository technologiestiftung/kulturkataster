"use client";

import { useInstitutionStore } from "@/lib/store/institutionStore";
import { hasReadableCultureIndex } from "@/lib/constants/cultureIndexRanges";
import { FC, useCallback } from "react";
import { FilterState } from "@/types";
import { FilterPanel } from "./FilterPanel";
import { ButtonWithTooltip } from "../ui/button-with-tooltip";
import FilterIcon from "@/icons/filter.svg";
import Search from "@/icons/search.svg";
import Close from "@/icons/close.svg";
import { useTranslation } from "react-i18next";

type FilterProps = {
	onSearchClick?: () => void;
	onShowFilter?: () => void;
};

const Filter: FC<FilterProps> = ({ onSearchClick, onShowFilter }) => {
	const {
		setFilters,
		filters,
		filteredInstitutions,
		categoryCounts,
		subcategoryCounts,
		cultureIndexRangeCounts,
		categories,
		districts,
		initializePublicData,
		allInstitutions,
	} = useInstitutionStore();

	const loading = categories === null || districts.length === 0;

	const retry = useCallback(() => {
		void initializePublicData();
	}, [initializePublicData]);

	const updateFilters = (newFilters: FilterState) => {
		setFilters(newFilters);
	};

	const { t } = useTranslation();
	const { t: tCommon } = useTranslation();

	return (
		<div className="flex h-full w-full flex-col">
			<div className="mb-8 flex w-full items-center gap-2 flex-row shrink-0">
				{onSearchClick && (
					<ButtonWithTooltip
						radius="full"
						variant="surface"
						tooltipSide="bottom"
						iconSize="lg"
						tooltip={tCommon("common.search.searchButton", {
							defaultValue: "Suchen",
						})}
						aria-label={tCommon("common.search.searchButton", {
							defaultValue: "Suchen",
						})}
						className="cursor-pointer"
						onClick={onSearchClick}
					>
						<Search className="size-5!" aria-hidden="true" />
					</ButtonWithTooltip>
				)}
				<ButtonWithTooltip
					radius="full"
					variant="surface"
					tooltipSide="bottom"
					tooltip={tCommon("common.filter.title", {
						defaultValue: "Kulturorte filtern",
					})}
					className="cursor-pointer h-14 md:mr-0 mr-16 flex-1 justify-between [&_svg]:size-6"
					onClick={onShowFilter}
				>
					<div className="flex items-center gap-2">
						<FilterIcon className="size-5!" />
						<span className="body2 font-bold">{t("content.filter.title")}</span>
					</div>
					<Close />
				</ButtonWithTooltip>
			</div>
			<div className="flex-1 overflow-auto mb-20 md:mb-0">
				<FilterPanel
					filters={filters}
					categoryGroups={categories ?? []}
					districts={districts}
					filteredCount={filteredInstitutions?.length ?? 0}
					categoryCounts={categoryCounts}
					subcategoryCounts={subcategoryCounts}
					cultureIndexRangeCounts={cultureIndexRangeCounts}
					showCultureIndex={hasReadableCultureIndex(allInstitutions)}
					loading={loading}
					error={null}
					onRetry={retry}
					onFiltersChange={updateFilters}
				/>
			</div>
		</div>
	);
};

export default Filter;
