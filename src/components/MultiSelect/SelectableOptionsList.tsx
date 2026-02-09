"use client";

import type { HTMLAttributes, ReactNode, RefObject } from "react";
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
}: SelectableOptionsListProps) {
	const isPanel = variant === "panel";
	const wrapperClassName = isPanel
		? cn(
				"pointer-events-auto flex rounded-sm border border-input bg-background",
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
	const headingId = headingLabel ? `${listId ?? "options"}-label` : undefined;

	return (
		<div className={wrapperClassName}>
			{headingLabel ? (
				<span
					className="body1 font-bold text-neutral-80 mb-2 flex-shrink-0"
					id={headingId}
				>
					{headingLabel}
				</span>
			) : null}
			<div
				ref={listRef}
				className={listClassName}
				role={isPanel ? undefined : "listbox"}
				aria-labelledby={!isPanel ? headingId : undefined}
				id={!isPanel ? listId : undefined}
			>
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
								type="button"
								onClick={() => onToggle(option.value)}
								className={cn(
									baseItemClassName,
									isChecked && "bg-neutral-5",
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
										asChild
										checked={isChecked}
										variant="filter"
										size="filter"
									>
										<span aria-hidden="true" className="pointer-events-none" />
									</Checkbox>
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
