"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import Check from "@/icons/check.svg";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const checkboxVariants = cva(
	"peer contrast:border-white bg-background dark:bg-input/30 data-[state=checked]:contrast:border-interaction-default data-[state=checked]:contrast:bg-interaction-default data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/100 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shrink-0 border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "rounded-2xl border-neutral-60",
				filter: "rounded-full border-neutral-80",
			},
			size: {
				default: "size-8 md:size-6",
				// The ::after pseudo element keeps the 16px desktop box but extends
				// the hit area to 24px (WCAG 2.5.8).
				filter:
					"relative h-8 w-8 md:h-4 md:w-4 after:absolute after:-inset-1 after:content-['']",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root> &
	VariantProps<typeof checkboxVariants>;

function Checkbox({ className, variant, size, ...props }: CheckboxProps) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(checkboxVariants({ variant, size, className }))}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				data-slot="checkbox-indicator"
				className="flex items-center justify-center text-current transition-none"
			>
				<Check className="size-3.5" aria-hidden="true" focusable="false" />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox, checkboxVariants };
