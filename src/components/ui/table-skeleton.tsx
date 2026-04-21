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
		<div className="space-y-3 w-full">
			<div className="flex items-center justify-between gap-3">
				<Skeleton className="h-9 w-64" />
				<Skeleton className="h-9 w-28" />
			</div>
			<div className="rounded-md border border-border overflow-hidden">
				<div className="flex items-center gap-4 px-4 py-3 bg-muted/40">
					{Array.from({ length: columnCount }).map((_, i) => (
						<Skeleton
							key={`th-${i}`}
							className="h-6"
							style={{ width: `${Math.floor(80 + ((i * 37) % 60))}px` }}
						/>
					))}
				</div>
				{Array.from({ length: rowCount }).map((_row, rowIdx) => (
					<div
						key={`tr-${rowIdx}`}
						className="flex items-center gap-4 px-4 py-3 border-b last:border-0 border-border"
					>
						{Array.from({ length: columnCount }).map((_col, colIdx) => (
							<Skeleton
								key={`td-${rowIdx}-${colIdx}`}
								className="h-6"
								style={{
									width: `${Math.floor(60 + (((rowIdx + colIdx) * 53) % 80))}px`,
								}}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
