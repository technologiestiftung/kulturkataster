import { Skeleton } from "@/components/ui/skeleton";

type TableSkeletonProps = {
	columnCount?: number;
	rowCount?: number;
};

export function TableSkeleton({
	columnCount = 5,
	rowCount = 8,
}: TableSkeletonProps) {
	return (
		<div className="w-full space-y-4">
			<div className="flex items-center justify-between gap-3">
				<Skeleton className="h-9 w-64" />
				<Skeleton className="h-9 w-28" />
			</div>
			<div className="relative w-full border border-neutral-20 rounded-md overflow-hidden">
				<div className="bg-neutral-5 border-b border-neutral-20">
					<div className="flex items-center gap-4 px-4 h-12">
						{Array.from({ length: columnCount }).map((_, i) => (
							<Skeleton key={`th-${i}`} className="h-4 flex-1" />
						))}
					</div>
				</div>
				<div>
					{Array.from({ length: rowCount }).map((_row, rowIdx) => (
						<div
							key={`tr-${rowIdx}`}
							className={`flex items-center gap-4 px-4 h-14 border-b border-neutral-20 last:border-0 ${rowIdx % 2 === 0 ? "bg-background" : "bg-neutral-5"}`}
						>
							{Array.from({ length: columnCount }).map((_col, colIdx) => (
								<Skeleton
									key={`td-${rowIdx}-${colIdx}`}
									className="h-4 flex-1"
								/>
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
