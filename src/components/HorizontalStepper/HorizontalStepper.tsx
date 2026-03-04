"use client";

import { cn } from "@/lib/utils";
import {
	HorizontalStepperProvider,
	StepConfig,
} from "./HorizontalStepperContext";

interface HorizontalStepperProps {
	steps: StepConfig[];
	initialStepId?: string;
	children: React.ReactNode;
	className?: string;
}

export function HorizontalStepper({
	steps,
	initialStepId,
	children,
	className,
}: HorizontalStepperProps) {
	return (
		<HorizontalStepperProvider steps={steps} initialStepId={initialStepId}>
			<div className={cn("flex flex-col w-full", className)}>{children}</div>
		</HorizontalStepperProvider>
	);
}
