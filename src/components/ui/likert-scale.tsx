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
			<div className="overflow-x-auto px-1">
				<RadioGroup
					ref={ref}
					id={groupId}
					name={name}
					orientation={orientation}
					className={cn(
						"relative flex min-w-full items-start gap-4 my-2",
						className,
					)}
					{...props}
				>
					{options.map((option, index) => {
						const itemId = `${groupId}-${option.value}`;
						const isFirst = index === 0;
						const isLast = index === options.length - 1;
						return (
							<div
								key={option.value}
								className="relative flex min-w-16 flex-[1_0_auto] flex-col items-center gap-1 px-2"
							>
								{options.length > 1 && (
									<div
										aria-hidden="true"
										className={cn(
											"pointer-events-none absolute top-3.5 h-px bg-border md:top-3",
											isFirst ? "left-1/2" : "-left-2",
											isLast ? "right-1/2" : "-right-2",
										)}
									/>
								)}
								<RadioGroupItem
									id={itemId}
									value={option.value}
									className={cn(
										"z-10 border-input bg-background",
										itemClassName,
									)}
								/>
								<Label
									htmlFor={itemId}
									emphasize={false}
									className={cn(
										"max-w-[110px] justify-center text-center",
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
