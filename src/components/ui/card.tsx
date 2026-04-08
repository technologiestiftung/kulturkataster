import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva("text-card-foreground", {
	variants: {
		variant: {
			default: "rounded-lg border bg-card shadow-xs",
			secondary: "rounded-sm bg-secondary border-0 md:p-6",
			tertiary: "rounded-sm bg-secondary border-0 p-4 h-full",
			none: "",
			hero: "rounded-t-lg overflow-hidden border-0 p-4",
			filter: "rounded bg-background border-0 p-6",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

export interface CardProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
	({ className, variant, ...props }, ref) => (
		<div
			ref={ref}
			className={cn(cardVariants({ variant }), className)}
			{...props}
		/>
	),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-col space-y-1.5 p-6", className)}
		{...props}
	/>
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("title", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("body1", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const cardContentVariants = cva("", {
	variants: {
		variant: {
			default: "md:p-6 pt-0",
			secondary: "md:p-6 pt-0",
			tertiary: "",
			none: "p-0",
			hero: "p-0",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

export interface CardContentProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof cardContentVariants> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
	({ className, variant, ...props }, ref) => (
		<div
			ref={ref}
			className={cn(cardContentVariants({ variant }), className)}
			{...props}
		/>
	),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center p-6 pt-0", className)}
		{...props}
	/>
));
CardFooter.displayName = "CardFooter";

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
};
