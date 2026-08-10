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
	itemClassName?: string;
	labelClassName?: string;
};

const LikertScale = React.forwardRef<
	React.ElementRef<typeof RadioGroup>,
	LikertScaleProps
>(
	(
		{
			options,
			className,
			itemClassName,
			labelClassName,
			name,
			id,
			orientation = "horizontal",
			...props
		},
		ref,
	) => {
		const generatedId = React.useId();
		const groupId = id ?? name ?? generatedId;

		return (
			<RadioGroup
				ref={ref}
				id={groupId}
				name={name}
				orientation={orientation}
				className={cn("relative flex w-full items-start gap-0", className)}
				{...props}
			>
				{options.length > 1 && (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute top-3.5 h-px bg-border md:top-3"
						style={{
							left: `${50 / options.length}%`,
							right: `${50 / options.length}%`,
						}}
					/>
				)}
				{options.map((option) => {
					const itemId = `${groupId}-${option.value}`;
					return (
						<div
							key={option.value}
							className="relative flex flex-[1_0_0] flex-col items-center gap-1"
						>
							<RadioGroupItem
								id={itemId}
								value={option.value}
								className={cn("z-10 border-input bg-background", itemClassName)}
							/>
							<Label
								htmlFor={itemId}
								emphasize={false}
								className={cn("text-center", labelClassName)}
							>
								{option.label}
							</Label>
						</div>
					);
				})}
			</RadioGroup>
		);
	},
);
LikertScale.displayName = "LikertScale";

export { LikertScale };
