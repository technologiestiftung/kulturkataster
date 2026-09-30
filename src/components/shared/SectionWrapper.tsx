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
	onClickAsButton?: boolean;
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
	onClickAsButton = true,
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
				onClickAsButton,
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
	onClickAsButton?: boolean;
};

const renderClickableContent = ({
	content,
	onClick,
	onClickAriaLabel,
	onClickAsButton = true,
}: ClickableContentArgs) =>
	onClickAsButton ? (
		<button
			type="button"
			className="w-full text-left"
			onClick={onClick}
			aria-label={onClickAriaLabel}
		>
			{content}
		</button>
	) : (
		<div
			role="button"
			tabIndex={0}
			className="w-full text-left"
			onClick={onClick}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onClick();
				}
			}}
			aria-label={onClickAriaLabel}
		>
			{content}
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
