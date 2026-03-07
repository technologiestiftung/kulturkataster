import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type FilterPanelSkeletonProps = {
	showSummary?: boolean;
	showDistricts?: boolean;
	showClosedToggle?: boolean;
};

export function FilterPanelSkeleton({
	showSummary = true,
	showDistricts = true,
	showClosedToggle = true,
}: FilterPanelSkeletonProps) {
	return (
		<div className="Filter-root h-full w-full overflow-auto flex flex-col gap-2">
			{showSummary && (
				<Card variant="filter">
					<div className="space-y-3">
						<Skeleton className="h-6 w-2/3" />
						{showClosedToggle && <Skeleton className="h-6 w-40" />}
					</div>
				</Card>
			)}

			{showDistricts && (
				<Card variant="filter">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Skeleton className="h-6 w-36" />
							<Skeleton className="h-5 w-24" />
						</div>
						<div className="flex flex-wrap gap-2">
							{Array.from({ length: 10 }).map((_, index) => (
								<Skeleton
									key={`filter-district-skeleton-${index}`}
									className="h-8 w-20 rounded-full"
								/>
							))}
						</div>
					</div>
				</Card>
			)}

			<div className="space-y-2">
				<Card key="filter-category-skeleton" variant="filter">
					<div className="space-y-3">
						{Array.from({ length: 24 }).map((_, index) => {
							const leftWidths = ["w-20", "w-24", "w-28", "w-32", "w-36"];
							const rightWidths = [
								"w-16",
								"w-24",
								"w-32",
								"w-40",
								"w-52",
								"w-60",
							];
							const leftWidth = leftWidths[index % leftWidths.length];
							const rightWidth = rightWidths[(index * 3) % rightWidths.length];

							return (
								<div
									className="flex items-center justify-between"
									key={`filter-category-item-skeleton-${index}`}
								>
									<Skeleton className={`h-6 ${leftWidth}`} />
									<Skeleton className={`h-6 ${rightWidth}`} />
								</div>
							);
						})}
					</div>
				</Card>
			</div>
		</div>
	);
}
