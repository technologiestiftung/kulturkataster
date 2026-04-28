"use client";

import { useInstitutionStore } from "@/lib/store/institutionStore";
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
		categories,
		districts,
		initializePublicData,
	} = useInstitutionStore();

	const loading = categories === null || districts.length === 0;

	const retry = useCallback(() => {
		void initializePublicData();
	}, [initializePublicData]);

	const updateFilters = (newFilters: FilterState) => {
		setFilters(newFilters);
	};

	const { t } = useTranslation("content");
	const { t: tCommon } = useTranslation("common");

	return (
		<>
			<div className="mb-8 flex w-full items-center gap-2 flex-row">
				{onSearchClick && (
					<ButtonWithTooltip
						radius="full"
						variant="surface"
						tooltipSide="bottom"
						iconSize="lg"
						tooltip={tCommon("search.searchButton", {
							defaultValue: "Suchen",
						})}
						className="cursor-pointer"
						onClick={onSearchClick}
					>
						<Search className="size-5!" />
					</ButtonWithTooltip>
				)}
				<ButtonWithTooltip
					radius="full"
					variant="surface"
					tooltipSide="bottom"
					tooltip={tCommon("filter.title", {
						defaultValue: "Kulturorte filtern",
					})}
					className="cursor-pointer h-14 md:mr-0 mr-16 flex-1 justify-between [&_svg]:size-6"
					onClick={onShowFilter}
				>
					<div className="flex items-center gap-2">
						<FilterIcon className="size-5!" />
						<span className="body2 font-bold">
							{t("filter.title", { ns: "content" })}
						</span>
					</div>
					<Close />
				</ButtonWithTooltip>
			</div>

			<FilterPanel
				filters={filters}
				categoryGroups={categories ?? []}
				districts={districts}
				filteredCount={filteredInstitutions?.length ?? 0}
				categoryCounts={categoryCounts}
				subcategoryCounts={subcategoryCounts}
				loading={loading}
				error={null}
				onRetry={retry}
				onFiltersChange={updateFilters}
			/>
		</>
	);
};

export default Filter;
