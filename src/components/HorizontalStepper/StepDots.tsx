"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const DOT_BASE_CLASS =
	"flex h-4 w-4 items-center justify-center rounded-full border-2 bg-neutral-20 transition-colors";

// Visually 16px, but the ::after pseudo element extends the hit area to 24px
// (WCAG 2.5.8) without changing the design.
const DOT_BUTTON_CLASS =
	"relative after:absolute after:-inset-1 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

// Shared dot/connector rendering for both StepIndicator (all stepper steps) and
// any caller needing dots over a SUBSET of steps (e.g. QuestionnaireBlockStep,
// which shows one dot per Themenblock, not per stepper step).
export function StepDots({
	total,
	currentIndex,
	onDotClick,
	getDotLabel,
	className,
}: {
	total: number;
	currentIndex: number;
	onDotClick?: (index: number) => void;
	/** Accessible label per dot; defaults to "Schritt {{current}} von {{total}}". */
	getDotLabel?: (index: number, total: number) => string;
	className?: string;
}) {
	const { t } = useTranslation();
	const resolveLabel = (index: number) =>
		getDotLabel?.(index, total) ??
		t("common.a11y.forms.stepOf", {
			current: index + 1,
			total,
			defaultValue: "Schritt {{current}} von {{total}}",
		});

	const dots = Array.from({ length: total }, (_, index) => {
		const isActive = index === currentIndex;
		const isPast = index < currentIndex;
		const isLast = index === total - 1;
		const dotClassName = cn(
			DOT_BASE_CLASS,
			(isActive || isPast) &&
				"border-primary bg-primary text-primary-foreground",
			!isActive && !isPast && "border-neutral-20 text-foreground",
		);
		return (
			<li key={index} className={cn("flex items-center", !isLast && "flex-1")}>
				{onDotClick ? (
					<button
						type="button"
						onClick={() => onDotClick(index)}
						aria-label={resolveLabel(index)}
						aria-current={isActive ? "step" : undefined}
						className={cn(dotClassName, DOT_BUTTON_CLASS)}
					/>
				) : (
					<div className={dotClassName} />
				)}
				{!isLast && (
					<div
						aria-hidden="true"
						className={cn(
							"h-0.5 flex-1 transition-colors",
							isPast ? "bg-primary" : "bg-neutral-20",
						)}
					/>
				)}
			</li>
		);
	});

	if (!onDotClick) {
		// Static progress: one image with the current position as its name.
		return (
			<div
				role="img"
				aria-label={resolveLabel(currentIndex)}
				className={cn("w-full", className)}
			>
				<ol aria-hidden="true" className="flex w-full items-center">
					{dots}
				</ol>
			</div>
		);
	}

	return (
		<nav
			aria-label={t("common.a11y.forms.stepNavigation", {
				defaultValue: "Fortschritt",
			})}
			className={cn("w-full", className)}
		>
			<ol className="flex w-full items-center">{dots}</ol>
		</nav>
	);
}
