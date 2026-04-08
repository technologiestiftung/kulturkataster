import { Skeleton } from "@/components/ui/skeleton";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

type FormWrapperLoadingSkeletonProps = {
	fieldRows?: number;
};

export function FormWrapperLoadingSkeleton({
	fieldRows = 6,
}: FormWrapperLoadingSkeletonProps) {
	const rowsPerSection = Math.max(2, Math.ceil(fieldRows / 2));

	return (
		<div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
			{Array.from({ length: 2 }).map((_, sectionIndex) => (
				<SectionWrapper
					key={`form-skeleton-section-${sectionIndex}`}
					cardVariant="secondary"
					bodyContent={
						<div className="space-y-4">
							<Skeleton className="h-7 w-48" />
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								{Array.from({ length: rowsPerSection }).map((__, rowIndex) => {
									const isFullWidth = rowIndex % 3 === 0;
									return (
										<div
											key={`form-skeleton-row-${sectionIndex}-${rowIndex}`}
											className={isFullWidth ? "md:col-span-2" : undefined}
										>
											<Skeleton className="h-14 w-full" />
										</div>
									);
								})}
							</div>
						</div>
					}
				/>
			))}
			<div className="flex justify-end gap-3 pt-2">
				<Skeleton className="h-14 w-32" />
				<Skeleton className="h-14 w-40" />
			</div>
		</div>
	);
}
