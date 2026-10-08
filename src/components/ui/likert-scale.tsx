"use client";

import * as React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface LikertScaleOption {
	value: string;
	label: React.ReactNode;
}

export type LikertScaleProps = Omit<
	React.ComponentPropsWithoutRef<typeof RadioGroup>,
	"variant" | "children"
> & {
	options: LikertScaleOption[];
	containerClassName?: string;
	itemClassName?: string;
	labelClassName?: string;
	/** Below `md`, list the options vertically instead of a horizontal scroll row. */
	stackOnMobile?: boolean;
};

// More options than this don't fit side by side with readable labels, so the
// scale is listed vertically at every screen size.
const MAX_HORIZONTAL_OPTIONS = 5;

type LikertLayout = "horizontal" | "stackedOnMobile" | "stacked";

const getLikertLayout = (
	optionCount: number,
	stackOnMobile: boolean,
): LikertLayout => {
	if (optionCount > MAX_HORIZONTAL_OPTIONS) return "stacked";
	return stackOnMobile ? "stackedOnMobile" : "horizontal";
};

// Horizontal rows use equal, shrinkable columns so they fit their container;
// stacked rows list radio and label side by side, one option per line.
const LAYOUT_CLASSES: Record<
	LikertLayout,
	{ group: string; line: string | null; item: string; label: string }
> = {
	horizontal: {
		group: "",
		line: "",
		item: "",
		label: "",
	},
	stackedOnMobile: {
		group: "flex-col md:flex-row",
		line: "hidden md:block",
		item: "w-full flex-none flex-row gap-3 md:w-auto md:flex-1 md:flex-col md:gap-1",
		label:
			"max-w-none justify-start text-left md:max-w-[110px] md:justify-center md:text-center",
	},
	stacked: {
		group: "flex-col",
		line: null,
		item: "w-full flex-none flex-row gap-3",
		label: "max-w-none justify-start text-left",
	},
};

const LikertScale = React.forwardRef<
	React.ElementRef<typeof RadioGroup>,
	LikertScaleProps
>(
	(
		{
			options,
			className,
			containerClassName,
			itemClassName,
			labelClassName,
			name,
			id,
			stackOnMobile = false,
			// Stacked (always or on mobile), arrow keys must work in both directions.
			orientation = getLikertLayout(options.length, stackOnMobile) ===
			"horizontal"
				? "horizontal"
				: undefined,
			...props
		},
		ref,
	) => {
		const generatedId = React.useId();
		const groupId = id ?? name ?? generatedId;
		const layout =
			LAYOUT_CLASSES[getLikertLayout(options.length, stackOnMobile)];

		return (
			<div className={cn("overflow-x-auto md:px-1", containerClassName)}>
				<RadioGroup
					ref={ref}
					id={groupId}
					name={name}
					orientation={orientation}
					className={cn(
						"relative flex min-w-full items-start gap-2 my-2",
						layout.group,
						className,
					)}
					{...props}
				>
					{options.length > 1 && layout.line !== null && (
						<div
							aria-hidden="true"
							className={cn(
								"pointer-events-none absolute left-10 right-10 top-3.5 h-px bg-border md:top-3",
								layout.line,
							)}
						/>
					)}
					{options.map((option) => {
						const itemId = `${groupId}-${option.value}`;
						return (
							<div
								key={option.value}
								className={cn(
									"relative flex min-w-0 flex-1 flex-col items-center gap-1 md:px-1",
									layout.item,
								)}
							>
								<RadioGroupItem
									id={itemId}
									value={option.value}
									className={cn(
										"z-10 shrink-0 border-input bg-background",
										itemClassName,
									)}
								/>
								<Label
									htmlFor={itemId}
									emphasize={false}
									className={cn(
										"max-w-[110px] justify-center text-center break-words hyphens-auto",
										layout.label,
										labelClassName,
									)}
								>
									{option.label}
								</Label>
							</div>
						);
					})}
				</RadioGroup>
			</div>
		);
	},
);
LikertScale.displayName = "LikertScale";

export { LikertScale };
