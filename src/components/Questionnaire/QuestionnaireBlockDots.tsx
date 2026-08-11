import { cn } from "@/lib/utils";

// Visually mirrors HorizontalStepper's StepIndicator (same dot/connector styling),
// but scoped to only the Themenblock steps, since the underlying stepper drives
// ALL wizard steps (consent, institution-link, blocks, review) and would otherwise
// render one dot per step, not one per Themenblock.
export function QuestionnaireBlockDots({
	total,
	currentIndex,
}: {
	total: number;
	currentIndex: number;
}) {
	return (
		<div className="flex w-full items-center">
			{Array.from({ length: total }, (_, index) => {
				const isActive = index === currentIndex;
				const isPast = index < currentIndex;
				const isLast = index === total - 1;
				return (
					<div
						key={index}
						className={cn("flex items-center", !isLast && "flex-1")}
					>
						<div
							className={cn(
								"flex h-4 w-4 items-center justify-center rounded-full border-2 bg-neutral-20 transition-colors",
								(isActive || isPast) &&
									"border-primary bg-primary text-primary-foreground",
								!isActive && !isPast && "border-neutral-20 text-foreground",
							)}
						/>
						{!isLast && (
							<div
								className={cn(
									"h-0.5 flex-1 transition-colors",
									isPast ? "bg-primary" : "bg-neutral-20",
								)}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}
