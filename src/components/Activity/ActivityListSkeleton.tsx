import { Skeleton } from "@/components/ui/skeleton";

type ActivityListSkeletonProps = {
	showFilters?: boolean;
	rowCount?: number;
};

export function ActivityListSkeleton({
	showFilters = false,
	rowCount = 6,
}: ActivityListSkeletonProps) {
	return (
		<div className="space-y-4">
			{showFilters && (
				<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
					{Array.from({ length: 6 }).map((_, index) => (
						<Skeleton
							key={`activity-filter-skeleton-${index}`}
							className="h-11"
						/>
					))}
				</div>
			)}
			<div className="divide-y divide-border rounded-md overflow-hidden">
				{Array.from({ length: rowCount }).map((_, index) => (
					<div key={`activity-row-skeleton-${index}`} className="p-3">
						<div className="flex items-center gap-3">
							<Skeleton className="h-4 w-4 rounded-full" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-4 w-10/12" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
