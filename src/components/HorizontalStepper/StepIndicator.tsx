"use client";

import { useHorizontalStepper } from "./HorizontalStepperContext";
import { StepDots } from "./StepDots";

interface StepIndicatorProps {
	className?: string;
}

export function StepIndicator({ className }: StepIndicatorProps) {
	const { steps, currentStepIndex, goToStep } = useHorizontalStepper();

	return (
		<StepDots
			total={steps.length}
			currentIndex={currentStepIndex}
			onDotClick={(index) => goToStep(steps[index].id)}
			className={className}
		/>
	);
}
