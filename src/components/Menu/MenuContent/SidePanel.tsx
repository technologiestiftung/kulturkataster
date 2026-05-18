"use client";

import Filter from "@/components/Filter/Filter";
import { LocationSearch } from "@/components/Search/LocationSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";

export function SidePanel({
	onSearchClick,
	onShowFilter,
	isBlocked = false,
	onPanelOpen,
	onVisibilityChange,
}: {
	onSearchClick?: () => void;
	onShowFilter?: () => void;
	isBlocked?: boolean;
	onPanelOpen?: () => void;
	onVisibilityChange?: (isVisible: boolean) => void;
}) {
	const isMobile = useIsMobile();
	const [hasResults, setHasResults] = useState(false);
	const [sidePanel, setSidePanel] = useState<"search" | "filter" | null>(null);
	const isPanelVisible = hasResults || sidePanel === "filter";

	useEffect(() => {
		setSidePanel(isMobile ? "search" : "filter");
	}, [isMobile]);

	useEffect(() => {
		if (isBlocked) {
			setSidePanel("search");
			setHasResults(false);
			return;
		}
		setSidePanel((prev) => prev ?? (isMobile ? "search" : "filter"));
	}, [isBlocked, isMobile]);

	useEffect(() => {
		onVisibilityChange?.(isPanelVisible);
	}, [isPanelVisible, onVisibilityChange]);

	const handleShowFilter = () => {
		onPanelOpen?.();
		if (sidePanel === "filter") {
			onShowFilter?.();
			setSidePanel("search");
			return;
		}
		setSidePanel("filter");
	};

	const handleShowSearch = () => {
		onPanelOpen?.();
		if (sidePanel === "filter") {
			onShowFilter?.();
		}
		setSidePanel("search");
		onSearchClick?.();
	};

	return (
		<div className="absolute inset-0 h-full pointer-events-none md:inset-y-0 md:left-0 md:max-w-[var(--sidebar-width)] z-8">
			<div
				className={`h-full w-full flex-row flex overflow-hidden p-4 transition-colors duration-200 ${isPanelVisible ? "bg-secondary shadow-lg" : "pointer-events-none"}`}
			>
				<div className="relative h-full flex-1">
					<div
						className={`absolute inset-0 transition-all duration-200 ${
							sidePanel === "search"
								? "opacity-100 translate-x-0"
								: "opacity-0 translate-x-3 pointer-events-none"
						}`}
					>
						<LocationSearch
							showResults={!isBlocked}
							onResultsChange={(results) => {
								setHasResults(results.length > 0);
							}}
							onFilterClick={handleShowFilter}
						/>
					</div>
					<div
						className={`absolute inset-0 transition-all duration-200 ${
							sidePanel === "filter"
								? "opacity-100 translate-x-0 pointer-events-auto"
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
