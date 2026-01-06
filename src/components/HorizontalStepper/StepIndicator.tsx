"use client";

import { cn } from "@/lib/utils";
import { useHorizontalStepper } from "./HorizontalStepperContext";

interface StepIndicatorProps {
	className?: string;
}

export function StepIndicator({ className }: StepIndicatorProps) {
	const { steps, currentStepId, goToStep, currentStepIndex } =
		useHorizontalStepper();

	return (
		<div className={cn("flex w-full items-center", className)}>
			{steps.map((step, index) => {
				const isActive = step.id === currentStepId;
				const isPast = index < currentStepIndex;
				const isLast = index === steps.length - 1;

				return (
					<div
						key={step.id}
						className={cn("flex items-center", !isLast && "flex-1")}
					>
						<button
							onClick={() => goToStep(step.id)}
							className={cn(
								"flex h-4 w-4 items-center justify-center rounded-full bg-neutral-20 border-2 transition-colors",
								isActive && "bg-primary border-primary text-primary-foreground",
								isPast &&
									!isActive &&
									"bg-primary border-primary text-primary-foreground",
								!isActive &&
									!isPast &&
									"border-neutral-20 text-muted-foreground",
							)}
						></button>
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
