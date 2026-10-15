"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({
	className,
	...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			className={cn(
				// The ::after pseudo element extends the hit area to >= 24px height (WCAG 2.5.8).
				"relative after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] peer data-[state=checked]:bg-black contrast:data-[state=checked]:bg-background ring-offset-1 focus-visible:ring-ring/100 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border-2 border-foreground shadow-xs transition-all outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className={cn(
					"bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] border-2 border-foreground  data-[state=unchecked]:-translate-x-0.5",
				)}
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch };
