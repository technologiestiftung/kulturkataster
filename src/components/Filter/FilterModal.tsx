"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FilterPanel } from "./FilterPanel";
import type { Category, District, FilterState } from "@/types";

type FilterModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	filters: FilterState | null;
	categoryGroups: Category[];
	districts: District[];
	filteredCount: number;
	categoryCounts: Record<string, number>;
	subcategoryCounts: Record<string, number>;
	loading: boolean;
	error: string | null;
	onRetry: () => void;
	onFiltersChange: (nextFilters: FilterState) => void;
};

export function FilterModal({
	open,
	onOpenChange,
	title,
	filters,
	categoryGroups,
	districts,
	filteredCount,
	categoryCounts,
	subcategoryCounts,
	loading,
	error,
	onRetry,
	onFiltersChange,
}: FilterModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent variant="fullscreen-muted" className="p-0">
				<div className="flex justify-center p-10">
					<div className="max-w-3xl  space-y-4">
						<DialogTitle className="sr-only">{title}</DialogTitle>
						<h2 className="">{title}</h2>
						<FilterPanel
							filters={filters}
							categoryGroups={categoryGroups}
							districts={districts}
							filteredCount={filteredCount}
							categoryCounts={categoryCounts}
							subcategoryCounts={subcategoryCounts}
							loading={loading}
							error={error}
							onRetry={onRetry}
							onFiltersChange={onFiltersChange}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
