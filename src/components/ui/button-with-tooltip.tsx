import * as React from "react";
import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export type ButtonWithTooltipProps = ButtonProps & {
	tooltip: string | React.ComponentProps<typeof TooltipContent>;
	tooltipSide?: "top" | "right" | "bottom" | "left";
	delayDuration?: number;
};

export const ButtonWithTooltip = React.forwardRef<
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
		const tooltipProps =
			typeof tooltip === "string" ? { children: tooltip } : tooltip;

		// A tooltip only describes its trigger, so icon-only buttons also need
		// the tooltip text as their accessible name.
		const ariaLabel =
			buttonProps["aria-label"] ??
			(typeof tooltip === "string" ? tooltip : undefined);

		return (
			<TooltipProvider delayDuration={delayDuration}>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button ref={ref} {...buttonProps} aria-label={ariaLabel}>
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
