import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm button ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90 ",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90",
				outline:
					"border border-input text-primary-dark bg-background hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				"menu-icon":
					" z-10 flex items-center justify-center [&_svg]:size-6 rounded-full transition-colors duration-300 cursor-pointer ",
				link: "text-primary underline-offset-4 hover:underline",
				rounded:
					"rounded-full shadow-md bg-background hover:bg-accent [&_svg]:size-6",
				accordion: "gap-2 justify-start text-primary-dark px-4",
				tag: "bg-neutral-10 font-light flex items-center justify-center px-4 rounded-full",
			},
			size: {
				default: "px-4.5 py-2.5 md:px-7 md:py-4",
				tag: "h-6",
				sm: "h-9 rounded-md px-3",
				lg: "h-11 rounded-md px-8",
				md: "",
				icon: "h-10 w-10",
				"icon-only": "h-12 w-12",
				"icon-default": "h-6 w-full",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export interface ButtonWithTooltipProps extends ButtonProps {
	tooltip: string | React.ComponentProps<typeof TooltipContent>;
	tooltipSide?: "top" | "right" | "bottom" | "left";
	delayDuration?: number;
}

const ButtonWithTooltip = React.forwardRef<
	HTMLButtonElement,
	ButtonWithTooltipProps
>(
	(
		{
			tooltip,
			tooltipSide = "left",
			delayDuration = 0,
			children,
			...buttonProps
		},
		ref,
	) => {
		// Convert string tooltip to object format
		const tooltipProps =
			typeof tooltip === "string" ? { children: tooltip } : tooltip;

		return (
			<TooltipProvider delayDuration={delayDuration}>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button ref={ref} {...buttonProps}>
							{children}
						</Button>
					</TooltipTrigger>
					<TooltipContent side={tooltipSide} {...tooltipProps} />
				</Tooltip>
			</TooltipProvider>
		);
	},
);
ButtonWithTooltip.displayName = "ButtonWithTooltip";

export { Button, buttonVariants, ButtonWithTooltip };
