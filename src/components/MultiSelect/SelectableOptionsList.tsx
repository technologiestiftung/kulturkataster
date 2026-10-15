"use client";

import type { HTMLAttributes, KeyboardEvent, RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { SelectOption } from "../FormWrapper";

type SelectableOptionsListProps = {
	options: SelectOption[];
	selectedValues: string[];
	onToggle: (value: string) => void;
	emptyText?: string;
	showCheckbox?: boolean;
	variant?: "panel" | "search";
	headingLabel?: string;
	multiSelect?: boolean;
	listId?: string;
	listRef?: RefObject<HTMLDivElement | null>;
	activeIndex?: number;
	getItemProps?: (index: number) => HTMLAttributes<HTMLElement>;
	containerClassName?: string;
	listClassName?: string;
	itemClassName?: string;
	descriptionClassName?: string;
	showHeaderCount?: boolean;
	showHeader?: boolean;
};

const PANEL_ITEM_CLASS =
	"flex min-w-0 items-center gap-3 border-b border-input px-4 py-3 text-left body3 last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-interaction-dark";
const SEARCH_ITEM_CLASS = "py-3 px-2 cursor-pointer rounded body3 border-b";

// Panel rows are real (tabbable) checkboxes/radios; search rows are listbox
// options driven by aria-activedescendant from the search input.
const getListRole = (isPanel: boolean, multiSelect: boolean) => {
	if (!isPanel) return "listbox";
	return multiSelect ? "group" : "radiogroup";
};

function OptionContent({
	option,
	isChecked,
	isPanel,
	multiSelect,
	showCheckbox,
	descriptionClassName,
}: {
	option: SelectOption;
	isChecked: boolean;
	isPanel: boolean;
	multiSelect: boolean;
	showCheckbox: boolean;
	descriptionClassName?: string;
}) {
	return (
		<>
			{showCheckbox ? (
				<Checkbox
					asChild={!multiSelect}
					checked={isChecked}
					variant="default"
					size="default"
					aria-hidden="true"
					tabIndex={-1}
					className="pointer-events-none"
				/>
			) : null}

			<span className="flex min-w-0 flex-1 flex-col gap-1">
				<span className={!isPanel ? "font-medium" : undefined}>
					{option.label}
				</span>
				{option.description ? (
					<span className={cn("body3 text-neutral-80", descriptionClassName)}>
						{option.description}
					</span>
				) : null}
			</span>
		</>
	);
}

export function SelectableOptionsList({
	options,
	selectedValues,
	onToggle,
	emptyText = "No items found",
	showCheckbox = true,
	variant = "search",
	multiSelect = true,
	headingLabel,
	listId,
	listRef,
	activeIndex,
	getItemProps,
	containerClassName,
	listClassName,
	itemClassName,
	descriptionClassName,
	showHeaderCount = true,
	showHeader = true,
}: SelectableOptionsListProps) {
	const { t } = useTranslation();
	const isPanel = variant === "panel";
	const wrapperClassName = isPanel
		? cn(
				"pointer-events-auto flex rounded-sm border border-neutral-20 bg-background",
				containerClassName,
			)
		: cn("h-full space-y-1 pointer-events-auto", containerClassName);
	const resolvedListClassName = cn(
		"h-full w-full overflow-auto",
		listClassName,
	);
	const emptyClassName = isPanel
		? "px-4 py-6 body3 text-foreground"
		: "body3 text-foreground px-2";
	const headerItemClassName = isPanel
		? "flex min-w-0 items-center justify-start gap-3 border-b border-input px-2 py-3 text-left body3"
		: "flex min-w-0 items-center justify-start gap-3 px-2 py-3 body3 border-b";
	const headingId = `${listId ?? "options"}-label`;
	const hasHeading = showHeader && Boolean(headingLabel);

	const handleItemKeyDown = (
		event: KeyboardEvent<HTMLDivElement>,
		value: string,
		index: number,
	) => {
		getItemProps?.(index).onKeyDown?.(event);
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			onToggle(value);
		}
	};

	return (
		<div className={wrapperClassName}>
			{/* The header sits outside the listbox (which may only contain
			    options), so listRef's children map 1:1 to the option indices. */}
			<div className={resolvedListClassName}>
				{showHeader ? (
					<div className={headerItemClassName}>
						{headingLabel ? (
							<span id={headingId} className="font-medium text-neutral-80">
								{headingLabel}
							</span>
						) : (
							<span />
						)}
						{showHeaderCount ? (
							<span className="text-neutral-80">
								{t("common.multiSelectModal.resultsCountNumber", {
									number: options.length,
									defaultValue: "{{number}} Ergebnisse",
								})}
							</span>
						) : null}
					</div>
				) : null}
				{options.length === 0 ? (
					<p className={emptyClassName}>{emptyText}</p>
				) : null}
				{/* Always rendered so aria-controls/listRef targets stay valid. */}
				<div
					ref={listRef}
					role={getListRole(isPanel, multiSelect)}
					aria-labelledby={hasHeading ? headingId : undefined}
					aria-multiselectable={!isPanel && multiSelect ? true : undefined}
					id={!isPanel ? listId : undefined}
				>
					{options.map((option, index) => {
						const value = option.value as string;
						const itemProps = getItemProps?.(index);
						const isChecked = selectedValues.includes(value);
						const isActive = activeIndex === index;
						const content = (
							<OptionContent
								option={option}
								isChecked={isChecked}
								isPanel={isPanel}
								multiSelect={multiSelect}
								showCheckbox={showCheckbox}
								descriptionClassName={descriptionClassName}
							/>
						);

						if (isPanel) {
							const rowProps = {
								tabIndex: 0,
								onClick: () => onToggle(value),
								onKeyDown: (event: KeyboardEvent<HTMLDivElement>) =>
									handleItemKeyDown(event, value, index),
								className: cn(
									PANEL_ITEM_CLASS,
									"w-full text-left",
									itemClassName,
								),
								children: content,
							};
							return multiSelect ? (
								<div
									key={value}
									role="checkbox"
									aria-checked={isChecked}
									{...rowProps}
								/>
							) : (
								<div
									key={value}
									role="radio"
									aria-checked={isChecked}
									{...rowProps}
								/>
							);
						}

						return (
							<div
								key={value}
								role="option"
								// Multi-select lists expose the checked state; single-select
								// (autocomplete) lists follow the keyboard highlight.
								aria-selected={multiSelect ? isChecked : isActive}
								tabIndex={-1}
								id={itemProps?.id}
								onClick={() => onToggle(value)}
								onMouseEnter={itemProps?.onMouseEnter}
								onMouseDown={(event) => event.preventDefault()}
								onKeyDown={(event) => handleItemKeyDown(event, value, index)}
								className={cn(
									SEARCH_ITEM_CLASS,
									isActive && "bg-black/10 contrast:bg-neutral-10",
									"hover:bg-black/10 contrast:hover:bg-neutral-10 outline-interaction-dark",
									"w-full text-left",
									itemClassName,
								)}
							>
								{content}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
