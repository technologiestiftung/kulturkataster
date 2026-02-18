"use client";

import type { HTMLAttributes, ReactNode, RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type SelectableOption = {
	value: string;
	label: ReactNode;
	description?: ReactNode;
};

type SelectableOptionsListProps = {
	options: SelectableOption[];
	selectedValues: string[];
	onToggle: (value: string) => void;
	emptyText?: string;
	showCheckbox?: boolean;
	variant?: "panel" | "search";
	headingLabel?: string;
	listId?: string;
	listRef?: RefObject<HTMLDivElement | null>;
	activeIndex?: number;
	getItemProps?: (index: number) => HTMLAttributes<HTMLElement>;
	containerClassName?: string;
	itemClassName?: string;
	descriptionClassName?: string;
	showHeaderCount?: boolean;
	showHeader?: boolean;
};

export function SelectableOptionsList({
	options,
	selectedValues,
	onToggle,
	emptyText = "No items found",
	showCheckbox = true,
	variant = "search",
	headingLabel,
	listId,
	listRef,
	activeIndex,
	getItemProps,
	containerClassName,
	itemClassName,
	descriptionClassName,
	showHeaderCount = true,
	showHeader = true,
}: SelectableOptionsListProps) {
	const { t } = useTranslation("common");
	const isPanel = variant === "panel";
	const wrapperClassName = isPanel
		? cn(
				"pointer-events-auto flex rounded-sm border border-neutral-20 bg-background",
				containerClassName,
			)
		: cn("h-full space-y-1 pointer-events-auto", containerClassName);
	const listClassName = isPanel
		? "h-full w-full overflow-auto"
		: "h-full w-full overflow-auto";
	const emptyClassName = isPanel
		? "px-4 py-6 body3 text-foreground"
		: "body3 text-foreground px-2";
	const baseItemClassName = isPanel
		? "flex min-w-0 items-center gap-3 border-b border-input px-4 py-3 text-left body3 last:border-b-0"
		: "py-3 px-2 cursor-pointer rounded body3 border-b";
	const headerItemClassName = isPanel
		? "flex min-w-0 items-center justify-start gap-3 border-b border-input px-2 py-3 text-left body3"
		: "flex min-w-0 items-center justify-start gap-3 px-2 py-3 body3 border-b";
	const headingId = `${listId ?? "options"}-label`;

	return (
		<div className={wrapperClassName}>
			<div
				ref={listRef}
				className={listClassName}
				role={isPanel ? undefined : "listbox"}
				aria-labelledby={!isPanel && headingLabel ? headingId : undefined}
				id={!isPanel ? listId : undefined}
			>
				{showHeader ? (
					<div className={headerItemClassName} id={headingId}>
						{headingLabel ? (
							<span className="font-medium text-neutral-80">
								{headingLabel}
							</span>
						) : (
							<span />
						)}
						{showHeaderCount ? (
							<span className="text-neutral-80">
								{t("multiSelectModal.resultsCountNumber", {
									number: options.length,
									defaultValue: "{{number}} Ergebnisse",
								})}
							</span>
						) : null}
					</div>
				) : null}
				{options.length === 0 ? (
					<p className={emptyClassName}>{emptyText}</p>
				) : (
					options.map((option, index) => {
						const itemProps = getItemProps?.(index);
						const isChecked = selectedValues.includes(option.value);
						const isActive = activeIndex === index;
						return (
							<button
								key={option.value}
								onClick={() => onToggle(option.value)}
								className={cn(
									baseItemClassName,
									!isPanel && isActive && "bg-black/10 contrast:bg-neutral-10",
									!isPanel &&
										"hover:bg-black/10 contrast:hover:bg-neutral-10 outline-interaction-dark",
									"w-full text-left",
									itemClassName,
								)}
								role={isPanel ? "button" : "option"}
								tabIndex={isPanel ? 0 : -1}
								aria-selected={!isPanel ? isActive : undefined}
								id={itemProps?.id}
								onMouseEnter={itemProps?.onMouseEnter}
								onMouseDown={(event) => {
									if (!isPanel) {
										event.preventDefault();
									}
								}}
								onKeyDown={(event) => {
									itemProps?.onKeyDown?.(event);
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										onToggle(option.value);
									}
								}}
							>
								{showCheckbox ? (
									<Checkbox
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
										<span
											className={cn(
												"body3 text-neutral-80",
												descriptionClassName,
											)}
										>
											{option.description}
										</span>
									) : null}
								</span>
							</button>
						);
					})
				)}
			</div>
		</div>
	);
}
