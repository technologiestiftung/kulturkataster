"use client";

import { cn } from "@/lib/utils";

// Shared dot/connector rendering for both StepIndicator (all stepper steps) and
// any caller needing dots over a SUBSET of steps (e.g. QuestionnaireBlockStep,
// which shows one dot per Themenblock, not per stepper step).
export function StepDots({
	total,
	currentIndex,
	onDotClick,
	className,
}: {
	total: number;
	currentIndex: number;
	onDotClick?: (index: number) => void;
	className?: string;
}) {
	return (
		<div className={cn("flex w-full items-center", className)}>
			{Array.from({ length: total }, (_, index) => {
				const isActive = index === currentIndex;
				const isPast = index < currentIndex;
				const isLast = index === total - 1;
				const dotClassName = cn(
					"flex h-4 w-4 items-center justify-center rounded-full border-2 bg-neutral-20 transition-colors",
					(isActive || isPast) &&
						"border-primary bg-primary text-primary-foreground",
					!isActive && !isPast && "border-neutral-20 text-foreground",
				);
				return (
					<div
						key={index}
						className={cn("flex items-center", !isLast && "flex-1")}
					>
						{onDotClick ? (
							<button
								type="button"
								onClick={() => onDotClick(index)}
								aria-label={`Go to step ${index + 1}`}
								className={dotClassName}
							/>
						) : (
							<div className={dotClassName} />
						)}
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
