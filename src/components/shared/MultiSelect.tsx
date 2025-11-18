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

export interface MultiSelectOption {
	value: string;
	label: string;
}

interface MultiSelectProps {
	options: MultiSelectOption[];
	selected: string[];
	onChange: (selected: string[]) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
}

export function MultiSelect({
	options,
	selected,
	onChange,
	placeholder = "Select items...",
	searchPlaceholder = "Search...",
	emptyText = "No items found",
}: MultiSelectProps) {
	const [open, setOpen] = useState(false);

	const toggleOption = (value: string) => {
		if (selected.includes(value)) {
			onChange(selected.filter((v) => v !== value));
		} else {
			onChange([...selected, value]);
		}
	};

	const removeOption = (value: string) => {
		onChange(selected.filter((v) => v !== value));
	};

	const selectedOptions = options.filter((opt) => selected.includes(opt.value));

	return (
		<div className="flex flex-col gap-2">
			{selectedOptions.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{selectedOptions.map((option) => (
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
							? `${selectedOptions.length} selected`
							: placeholder}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full p-0" align="start">
					<Command>
						<CommandInput placeholder={searchPlaceholder} />
						<CommandList>
							<CommandEmpty>{emptyText}</CommandEmpty>
							<CommandGroup>
								{options.map((option) => (
									<CommandItem
										key={option.value}
										value={option.value}
										onSelect={() => toggleOption(option.value)}
									>
										<div
											className={cn(
												"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
												selected.includes(option.value)
													? "bg-primary text-primary-foreground"
													: "opacity-50 [&_svg]:invisible",
											)}
										>
											<Check className="h-4 w-4" />
										</div>
										<span>{option.label}</span>
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
