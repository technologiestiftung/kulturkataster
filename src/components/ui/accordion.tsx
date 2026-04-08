"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cva, type VariantProps } from "class-variance-authority";
import ChevronDown from "@/icons/chevron-down.svg";

import { cn } from "@/lib/utils";

const accordionItemVariants = cva("", {
	variants: {
		variant: {
			default: "border-b last:border-b-0",
			secondary: "border-b-0 flex flex-col-reverse",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

const accordionTriggerVariants = cva(
	"group  focus-visible:border-ring focus-visible:ring-ring/100 flex flex-1 items-start justify-between gap-4 rounded-md text-left font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "py-2 [&[data-state=open]>svg]:-rotate-180 font-bold",
				secondary:
					"py-2 [&[data-state=open]>svg]:-rotate-180 font-bold body2 text-primary-dark gap-2",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

const accordionContentVariants = cva("pt-0", {
	variants: {
		variant: {
			default: "pb-4",
			secondary: "pb-2",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

function Accordion({
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
	return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
	className,
	variant = "default",
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Item> &
	VariantProps<typeof accordionItemVariants>) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn(accordionItemVariants({ variant }), className)}
			{...props}
		/>
	);
}

function AccordionTrigger({
	className,
	children,
	variant = "default",
	action,
	actionClassName,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> &
	VariantProps<typeof accordionTriggerVariants> & {
		action?: React.ReactNode;
		actionClassName?: string;
	}) {
	return (
		<AccordionPrimitive.Header className="flex items-center gap-2">
			<AccordionPrimitive.Trigger
				data-slot="accordion-trigger"
				className={cn(
					accordionTriggerVariants({ variant }),
					"justify-start items-center",
					className,
				)}
				{...props}
			>
				{
					<ChevronDown
						className="pointer-events-none size-5 shrink-0 translate-y-0.5 transition-transform duration-200"
						aria-hidden="true"
						focusable="false"
					/>
				}
				{children}
				{/* {!isSecondary && (
					<ChevronDown
						className="pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200"
						aria-hidden="true"
						focusable="false"
					/>
				)} */}
			</AccordionPrimitive.Trigger>
			{action ? (
				<div className={cn("shrink-0", actionClassName)}>{action}</div>
			) : null}
		</AccordionPrimitive.Header>
	);
}

function AccordionContent({
	className,
	children,
	variant = "default",
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Content> &
	VariantProps<typeof accordionContentVariants>) {
	return (
		<AccordionPrimitive.Content
			data-slot="accordion-content"
			className="motion-safe:data-[state=closed]:animate-accordion-up motion-safe:data-[state=open]:animate-accordion-down overflow-hidden body3"
			{...props}
		>
			<div className={cn(accordionContentVariants({ variant }), className)}>
				{children}
			</div>
		</AccordionPrimitive.Content>
	);
}

export {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
	accordionItemVariants,
	accordionTriggerVariants,
	accordionContentVariants,
};
