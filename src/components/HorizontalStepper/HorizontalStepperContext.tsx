"use client";

import { createContext, useCallback, useContext, useState } from "react";

export interface StepConfig {
	id: string;
	icon: React.ReactNode;
	title: string;
	description?: string;
	questions?: string[];
	canProceed?: () => boolean;
}

interface HorizontalStepperContextValue {
	currentStepId: string;
	steps: StepConfig[];
	goToStep: (stepId: string) => void;
	nextStep: () => void;
	previousStep: () => void;
	canGoNext: boolean;
	canGoPrevious: boolean;
	currentStepIndex: number;
	totalSteps: number;
	setStepValidation: (stepId: string, canProceed: () => boolean) => void;
}

const HorizontalStepperContext = createContext<
	HorizontalStepperContextValue | undefined
>(undefined);

interface HorizontalStepperProviderProps {
	steps: StepConfig[];
	initialStepId?: string;
	children: React.ReactNode;
}

export function HorizontalStepperProvider({
	steps,
	initialStepId,
	children,
}: HorizontalStepperProviderProps) {
	const [currentStepId, setCurrentStepId] = useState(
		initialStepId || steps[0]?.id,
	);
	const initialIndex = Math.max(
		0,
		steps.findIndex((step) => step.id === (initialStepId || steps[0]?.id)),
	);
	const [furthestReachedStepIndex, setFurthestReachedStepIndex] =
		useState(initialIndex);
	const [stepValidations, setStepValidations] = useState<
		Map<string, () => boolean>
	>(new Map());

	const currentStepIndex = steps.findIndex((step) => step.id === currentStepId);
	const currentStep = steps[currentStepIndex];

	const setStepValidation = useCallback(
		(stepId: string, canProceed: () => boolean) => {
			setStepValidations((prev) => {
				const next = new Map(prev);
				next.set(stepId, canProceed);
				return next;
			});
		},
		[],
	);

	const canCurrentStepProceed = useCallback(() => {
		const validationFn = stepValidations.get(currentStepId);
		if (validationFn) {
			return validationFn();
		}
		if (currentStep?.canProceed) {
			return currentStep.canProceed();
		}
		return true;
	}, [currentStepId, currentStep, stepValidations]);

	const goToStep = useCallback(
		(stepId: string) => {
			const targetIndex = steps.findIndex((step) => step.id === stepId);
			const currentIndex = steps.findIndex((step) => step.id === currentStepId);
			if (targetIndex === -1) return;
			const isBackwardNavigation = targetIndex < currentIndex;
			const isAllowedForwardJump = targetIndex <= furthestReachedStepIndex + 1;
			if (
				stepId !== currentStepId &&
				((!isBackwardNavigation && !isAllowedForwardJump) ||
					(!isBackwardNavigation && !canCurrentStepProceed()))
			) {
				return;
			}
			setCurrentStepId(stepId);
			if (!isBackwardNavigation) {
				setFurthestReachedStepIndex((prev) => Math.max(prev, targetIndex));
			}
		},
		[currentStepId, canCurrentStepProceed, steps, furthestReachedStepIndex],
	);

	const nextStep = useCallback(() => {
		const currentIndex = steps.findIndex((step) => step.id === currentStepId);
		if (currentIndex < steps.length - 1 && canCurrentStepProceed()) {
			const nextIndex = currentIndex + 1;
			setCurrentStepId(steps[nextIndex].id);
			setFurthestReachedStepIndex((prev) => Math.max(prev, nextIndex));
		}
	}, [steps, currentStepId, canCurrentStepProceed]);

	const previousStep = useCallback(() => {
		const currentIndex = steps.findIndex((step) => step.id === currentStepId);
		if (currentIndex > 0) {
			setCurrentStepId(steps[currentIndex - 1].id);
		}
	}, [steps, currentStepId]);

	const canGoNext =
		currentStepIndex < steps.length - 1 && canCurrentStepProceed();
	const canGoPrevious = currentStepIndex > 0;

	return (
		<HorizontalStepperContext.Provider
			value={{
				currentStepId,
				steps,
				goToStep,
				nextStep,
				previousStep,
				canGoNext,
				canGoPrevious,
				currentStepIndex,
				totalSteps: steps.length,
				setStepValidation,
			}}
		>
			{children}
		</HorizontalStepperContext.Provider>
	);
}

export function useHorizontalStepper() {
	const context = useContext(HorizontalStepperContext);
	if (!context) {
		throw new Error(
			"useHorizontalStepper must be used within HorizontalStepperProvider",
		);
	}
	return context;
}
