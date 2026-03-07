"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const resetBodyPointerEvents = () => {
	if (typeof document === "undefined") return;
	if (document.body.style.pointerEvents === "none") {
		document.body.style.pointerEvents = "";
	}
};

type PopoverProps = React.ComponentProps<typeof PopoverPrimitive.Root>;

const Popover = ({ onOpenChange, open, ...props }: PopoverProps) => {
	React.useEffect(() => {
		return () => {
			resetBodyPointerEvents();
		};
	}, []);

	React.useEffect(() => {
		if (open === false) {
			resetBodyPointerEvents();
		}
	}, [open]);

	return (
		<PopoverPrimitive.Root
			open={open}
			{...props}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					resetBodyPointerEvents();
				}
				onOpenChange?.(nextOpen);
			}}
		/>
	);
};

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
	React.ElementRef<typeof PopoverPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
		portal?: boolean;
	}
>(
	(
		{ className, align = "center", sideOffset = 4, portal = true, ...props },
		ref,
	) => {
		const content = (
			<PopoverPrimitive.Content
				ref={ref}
				align={align}
				sideOffset={sideOffset}
				className={cn(
					"z-[100] w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=closed]:zoom-out-95 motion-safe:data-[state=open]:zoom-in-95 motion-safe:data-[side=bottom]:slide-in-from-top-2 motion-safe:data-[side=left]:slide-in-from-right-2 motion-safe:data-[side=right]:slide-in-from-left-2 motion-safe:data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
					className,
				)}
				{...props}
			/>
		);

		if (!portal) {
			return content;
		}

		return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>;
	},
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
