"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

const statusDotVariants = cva("rounded-full", {
	variants: {
		tone: {
			success: "bg-brand-default",
			info: "bg-input",
			warning: "bg-alert",
			error: "bg-alert",
			neutral: "bg-black",
		},
		size: {
			sm: "h-2 w-2",
			md: "h-4 w-4",
		},
	},
	defaultVariants: {
		tone: "neutral",
		size: "md",
	},
});

type StatusDotProps = {
	label?: string;
	className?: string;
	labelClassName?: string;
	tone?: VariantProps<typeof statusDotVariants>["tone"];
	size?: VariantProps<typeof statusDotVariants>["size"];
	showLabel?: "always" | "hover";
};

function StatusDot({
	tone,
	size,
	label,
	className,
	labelClassName,
	showLabel = "always",
}: StatusDotProps) {
	const dot = (
		<span
			aria-hidden="true"
			className={cn(statusDotVariants({ tone, size }))}
		/>
	);

	if (label && showLabel === "hover") {
		return (
			<TooltipProvider delayDuration={0}>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className={cn("inline-flex items-center", className)}>
							{dot}
						</span>
					</TooltipTrigger>
					<TooltipContent side="top" align="center">
						<span className={cn("text-background", labelClassName)}>
							{label}
						</span>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return (
		<span className={cn("inline-flex items-center gap-2", className)}>
			{dot}
			{label && showLabel === "always" && (
				<span className={cn("text-foreground", labelClassName)}>{label}</span>
			)}
		</span>
	);
}

export { StatusDot, statusDotVariants };
