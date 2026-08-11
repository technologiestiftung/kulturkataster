"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

function Label({
	className,
	required,
	emphasize = true,
	children,
	...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & {
	required?: boolean;
	emphasize?: boolean;
}) {
	return (
		<LabelPrimitive.Root
			data-slot="label"
			className={cn(
				"flex items-center text-wrap flex-wrap gap-1 body2 text-foreground select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
				className,
			)}
			{...props}
		>
			{emphasize ? (
				<strong>
					{children}
					{required && <span aria-hidden="true"> *</span>}
				</strong>
			) : (
				<>
					{children}
					{required && <span aria-hidden="true"> *</span>}
				</>
			)}
		</LabelPrimitive.Root>
	);
}

export { Label };
