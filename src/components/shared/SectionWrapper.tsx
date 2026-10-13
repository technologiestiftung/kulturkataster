"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export type SectionCardVariant =
	| "default"
	| "secondary"
	| "tertiary"
	| "muted"
	| "none"
	| "hero";

type SectionWrapperProps = {
	wrapperId?: string;
	wrapperClassName?: string;
	spanClassName?: string;
	useAccordion?: boolean;
	accordionValue?: string;
	accordionDefaultOpen?: boolean;
	accordionVariant?: "default" | "secondary";
	accordionTriggerClassName?: string;
	accordionTitle?: ReactNode;
	accordionAction?: ReactNode;
	accordionContentClassName?: string;
	cardVariant?: SectionCardVariant;
	cardClassName?: string;
	bodyContent: ReactNode;
	onClick?: () => void;
	onClickAriaLabel?: string;
	shouldRender?: boolean;
};

export function SectionWrapper({
	wrapperId,
	wrapperClassName,
	spanClassName,
	useAccordion,
	accordionValue,
	accordionDefaultOpen,
	accordionVariant = "default",
	accordionTitle,
	accordionAction,
	accordionContentClassName,
	cardVariant = "none",
	cardClassName,
	bodyContent,
	onClick,
	onClickAriaLabel,
	shouldRender = true,
}: SectionWrapperProps) {
	if (!shouldRender) return null;
	const wrappedContent = renderWrappedContent({
		bodyContent,
		cardVariant,
		cardClassName,
	});

	const interactiveContent = onClick
		? renderClickableContent({
				content: wrappedContent,
				onClick,
				onClickAriaLabel,
			})
		: wrappedContent;

	const content = useAccordion
		? renderAccordionContent({
				value: accordionValue,
				defaultOpen: accordionDefaultOpen,
				variant: accordionVariant,
				title: accordionTitle,
				action: accordionAction,
				contentClassName: accordionContentClassName,
				content: interactiveContent,
			})
		: interactiveContent;

	return (
		<div id={wrapperId} className={cn(spanClassName, wrapperClassName)}>
			{content}
		</div>
	);
}

type WrappedContentArgs = {
	bodyContent: ReactNode;
	cardVariant: SectionWrapperProps["cardVariant"];
	cardClassName?: string;
};

const renderWrappedContent = ({
	bodyContent,
	cardVariant,
	cardClassName,
}: WrappedContentArgs) =>
	cardVariant === "none" ? (
		bodyContent
	) : (
		<Card variant={cardVariant} className={cardClassName}>
			<CardContent variant={cardVariant}>{bodyContent}</CardContent>
		</Card>
	);

type ClickableContentArgs = {
	content: ReactNode;
	onClick: () => void;
	onClickAriaLabel?: string;
};

// A full-size button sits behind the content, so the content keeps its
// semantics (headings, links) and nested controls stay separately operable.
const renderClickableContent = ({
	content,
	onClick,
	onClickAriaLabel,
}: ClickableContentArgs) => (
	<div className="relative w-full text-left rounded-lg has-[>button:focus-visible]:ring-2 has-[>button:focus-visible]:ring-interaction-dark">
		<button
			type="button"
			className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none"
			onClick={onClick}
			aria-label={onClickAriaLabel}
		/>
		<div className="relative z-10 pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_[role=button]]:pointer-events-auto">
			{content}
		</div>
	</div>
);

type AccordionContentArgs = {
	value?: string;
	defaultOpen?: boolean;
	variant?: "default" | "secondary";
	title?: ReactNode;
	action?: ReactNode;
	contentClassName?: string;
	content: ReactNode;
};

const renderAccordionContent = ({
	value,
	defaultOpen,
	variant = "default",
	title,
	action,
	contentClassName,
	content,
}: AccordionContentArgs) => (
	<Accordion
		type="single"
		collapsible
		defaultValue={defaultOpen ? value : undefined}
		className="w-full"
	>
		<AccordionItem value={value ?? "section"} variant={variant}>
			<AccordionTrigger className="body2" variant={variant} action={action}>
				{title ?? <span className="sr-only">Section</span>}
			</AccordionTrigger>
			<AccordionContent variant={variant} className={contentClassName}>
				{content}
			</AccordionContent>
		</AccordionItem>
	</Accordion>
);
