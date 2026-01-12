import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function InstitutionDetailSkeleton() {
	return (
		<section className="p-2 h-full w-full" aria-busy="true">
			<Card className="w-full rounded-lg overflow-hidden border-none">
				<CardHeader className="p-0 bg-neutral-20">
					<div className="p-4 space-y-2">
						<Skeleton className="h-4 w-1/3" />
						<CardTitle className="px-0">
							<Skeleton className="h-8 w-3/4" />
						</CardTitle>
						<div className="flex items-center gap-2">
							<Skeleton className="h-6 w-6 rounded-full" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					</div>
					<div className="bg-neutral-10 p-4 flex gap-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-32" />
					</div>
				</CardHeader>

				<CardContent className="p-4 space-y-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-4 w-1/3" />
					</div>

					<div className="space-y-2">
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-3 w-3/4" />
						<Skeleton className="h-3 w-2/3" />
						<Skeleton className="h-3 w-1/2" />
					</div>

					<Skeleton className="h-9 w-24" />
				</CardContent>
			</Card>
		</section>
	);
}

export { InstitutionDetailSkeleton };
