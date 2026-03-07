import InstitutionCardSkeleton from "./InstitutionCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function ListViewSkeleton() {
	return (
		<div className="ListView-root w-full h-full flex flex-col items-center bg-neutral-10">
			<div className="h-full w-full max-w-5xl p-4 mt-20 space-y-6">
				<div className="space-y-2">
					<Skeleton className="h-10 w-64" />
					<Skeleton className="h-8 w-80" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Skeleton className="h-6 w-3/4" />
				</div>
				<div className="space-y-2">
					<div className="flex items-end justify-between gap-4 md:flex-row flex-col">
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-14 w-full md:w-80" />
					</div>
					<div className="grid grid-cols-7 gap-1">
						{Array.from({ length: 7 }).map((_, index) => (
							<Skeleton
								key={`list-view-letter-skeleton-${index}`}
								className="h-8"
							/>
						))}
					</div>
					<div className="space-y-2">
						{Array.from({ length: 4 }).map((_, index) => (
							<InstitutionCardSkeleton
								key={`list-view-initial-skeleton-${index}`}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
