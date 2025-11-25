"use client";

import * as React from "react";
import { useState } from "react";
import { Check, X, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
	value: string;
	label: string;
	description?: string;
}

interface SearchableSelectProps {
	options: SearchableSelectOption[];
	selected: string[];
	onChange: (selected: string[]) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	allowMultiple?: boolean;
	previewCount?: number;
	onSearch?: (value: string) => void;
}

export function SearchableSelect({
	options,
	selected,
	onChange,
	placeholder = "Search and select...",
	searchPlaceholder = "Type to search...",
	emptyText = "No results found",
	allowMultiple = true,
	previewCount = 3,
	onSearch,
}: SearchableSelectProps) {
	const [open, setOpen] = useState(false);
	const [showSelectedOnly, setShowSelectedOnly] = useState(false);
	const [query, setQuery] = useState("");

	const selectOption = (value: string) => {
		if (allowMultiple) {
			if (selected.includes(value)) {
				onChange(selected.filter((v) => v !== value));
			} else {
				onChange([...selected, value]);
			}
		} else {
			onChange([value]);
			setOpen(false);
		}
	};

	const removeOption = (value: string) => {
		onChange(selected.filter((v) => v !== value));
	};

	const selectedOptions = options.filter((opt) => selected.includes(opt.value));
	const previewSelections = allowMultiple
		? selectedOptions.slice(0, previewCount)
		: [];
	const overflowCount =
		allowMultiple && selectedOptions.length > previewCount
			? selectedOptions.length - previewCount
			: 0;

	const filteredOptions = showSelectedOnly
		? options.filter((opt) => selected.includes(opt.value))
		: options;

	return (
		<div className="flex flex-col gap-2">
			{allowMultiple && selectedOptions.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{previewSelections.map((option) => (
						<Badge key={option.value} variant="secondary" className="gap-1">
							{option.label}
							<button
								type="button"
								className="ml-1 hover:bg-muted rounded-full"
								onClick={() => removeOption(option.value)}
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
					{overflowCount > 0 && (
						<Badge variant="secondary">{`+${overflowCount} more`}</Badge>
					)}
				</div>
			)}

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
					>
						{selectedOptions.length > 0
							? allowMultiple
								? `${selectedOptions.length} selected`
								: selectedOptions[0].label
							: placeholder}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full p-0" align="start">
					<Command>
						<div className="flex items-center justify-between px-3 pt-3 pb-1 gap-2">
							<CommandInput
								placeholder={searchPlaceholder}
								className="flex-1"
								value={query}
								onValueChange={(value) => {
									setQuery(value);
									onSearch?.(value);
								}}
							/>
							{allowMultiple && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="shrink-0"
									onClick={() => setShowSelectedOnly(!showSelectedOnly)}
								>
									{showSelectedOnly
										? "Show all"
										: `Selected (${selected.length})`}
								</Button>
							)}
						</div>
						<CommandList>
							<CommandEmpty>{emptyText}</CommandEmpty>
							<CommandGroup>
								{filteredOptions.map((option) => (
									<CommandItem
										key={option.value}
										value={option.value}
										keywords={[option.label, option.description || ""]}
										onSelect={() => selectOption(option.value)}
									>
										<div className="flex flex-1 items-start gap-2">
											{allowMultiple && (
												<div
													className={cn(
														"mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
														selected.includes(option.value)
															? "bg-primary text-primary-foreground"
															: "opacity-50 [&_svg]:invisible",
													)}
												>
													<Check className="h-4 w-4" />
												</div>
											)}
											<div className="flex-1">
												<div className="flex items-center">
													<span className="font-medium">{option.label}</span>
													{!allowMultiple &&
														selected.includes(option.value) && (
															<Check className="ml-auto h-4 w-4" />
														)}
												</div>
												{option.description && (
													<p className="text-xs text-muted-foreground mt-0.5">
														{option.description}
													</p>
												)}
											</div>
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
