"use client";

import Filter from "@/components/Filter/Filter";
import { LocationSearch } from "@/components/Search/LocationSearch";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useState } from "react";

export function SidePanel({
	onSearchClick,
	onShowFilter,
}: {
	onSearchClick?: () => void;
	onShowFilter?: () => void;
}) {
	const [hasResults, setHasResults] = useState(false);
	const [sidePanel, setSidePanel] = useState<"search" | "filter" | null>(
		"search",
	);
	const resetFilters = useInstitutionStore((state) => state.resetFilters);

	const handleShowFilter = () => {
		if (sidePanel === "filter") {
			resetFilters();
			onShowFilter?.();
			setSidePanel("search");
			return;
		}
		setSidePanel("filter");
	};

	const handleShowSearch = () => {
		if (sidePanel === "filter") {
			resetFilters();
			onShowFilter?.();
		}
		setSidePanel("search");
		onSearchClick?.();
	};

	return (
		<div className="absolute inset-0 h-full md:inset-y-0 md:left-0 md:w-[var(--sidebar-width)] z-10">
			<div
				className={`h-full w-full overflow-hidden p-5 transition-colors duration-200 ${hasResults || sidePanel === "filter" ? "md:bg-secondary shadow-lg" : ""}`}
			>
				<div className="relative h-full">
					<div
						className={`absolute inset-0 transition-all duration-200 ${
							sidePanel === "search"
								? "opacity-100 translate-x-0"
								: "opacity-0 translate-x-3 pointer-events-none"
						}`}
					>
						<LocationSearch
							onResultsChange={(results) => {
								setHasResults(results.length > 0);
							}}
							onFilterClick={handleShowFilter}
						/>
					</div>
					<div
						className={`absolute inset-0  transition-all duration-200 ${
							sidePanel === "filter"
								? "opacity-100 translate-x-0"
								: "opacity-0 -translate-x-3 pointer-events-none"
						}`}
					>
						<Filter
							onSearchClick={handleShowSearch}
							onShowFilter={handleShowFilter}
						></Filter>
					</div>
				</div>
			</div>
		</div>
	);
}
