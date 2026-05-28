"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

type TabsVariant = "default" | "modalTabs";

const TabsVariantContext = React.createContext<{
	variant?: TabsVariant;
}>({
	variant: "default",
});

const TabsList = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
		variant?: TabsVariant;
	}
>(({ className, variant = "default", ...props }, ref) => (
	<TabsVariantContext.Provider value={{ variant }}>
		<TabsPrimitive.List
			ref={ref}
			className={cn(
				"gap-2 w-full border-b overflow-x-auto overflow-y-hidden md:overflow-visible border-border",
				variant === "modalTabs"
					? "border-none md:inline-flex md:items-end"
					: "inline-flex items-end",
				className,
			)}
			{...props}
		/>
	</TabsVariantContext.Provider>
));

TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
	const { variant } = React.useContext(TabsVariantContext);

	return (
		<TabsPrimitive.Trigger
			ref={ref}
			className={cn(
				"inline-flex items-center justify-center whitespace-nowrap px-6 py-4 text-lg font-bold transition-all disabled:pointer-events-none disabled:opacity-50 border border-border relative mb-[-1px]",
				// ring
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				// active state
				"data-[state=active]:bg-background data-[state=inactive]:bg-neutral-5",
				// variant styles
				variant === "modalTabs"
					? "text-neutral-80 data-[state=active]:text-interaction-dark rounded-md max-md:w-full max-md:mb-2"
					: "text-foreground data-[state=active]:border-b-background rounded-t-sm data-[state=active]:text-foreground",
				className,
			)}
			{...props}
		/>
	);
});

TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn(
			"mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
			className,
		)}
		{...props}
	/>
));

TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
