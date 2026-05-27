"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import ChevronDown from "@/icons/chevron-down.svg";
import { SelectableOptionsList } from "@/components/MultiSelect/SelectableOptionsList";
import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";
import { SelectOption } from "../FormWrapper";

export type MultiSelectFilterConfig = {
	id: string;
	label: string;
	dependsOn?: string;
	options: SelectOption[];
};

export type MultiSelectSortOption = {
	id: string;
	label: string;
	compare?: (a: SelectOption, b: SelectOption) => number;
};

interface MultiSelectModalProps {
	title: string;
	options: SelectOption[];
	filteredOptions?: SelectOption[];
	selected: string[];
	onChange: (selected: string[]) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	previewCount?: number;
	filters?: MultiSelectFilterConfig[];
	sortOptions?: MultiSelectSortOption[];
	filterPanel?: ReactNode;
	disabled?: boolean;
}

const hasAnyValue = (values: string[] | undefined) =>
	Array.isArray(values) && values.length > 0;

const getOptionText = (
	value: SelectOption["label"] | SelectOption["searchText"],
) => (typeof value === "string" ? value : String(value ?? ""));

export function MultiSelectModal({
	title,
	options,
	filteredOptions,
	selected,
	onChange,
	placeholder = "Select items...",
	searchPlaceholder = "Search...",
	emptyText = "No items found",
	previewCount = 3,
	filters = [],
	sortOptions = [],
	filterPanel,
	disabled = false,
}: MultiSelectModalProps) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [draftSelected, setDraftSelected] = useState<string[]>(selected);
	const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
		{},
	);
	const [showSelectedOnly, setShowSelectedOnly] = useState(false);

	const defaultSortOption = useMemo<MultiSelectSortOption>(
		() => ({
			id: "label",
			label: t("common.multiSelectModal.sort.az"),
			compare: (a, b) =>
				getOptionText(a.label).localeCompare(getOptionText(b.label)),
		}),
		[t],
	);

	const resolvedSortOptions = useMemo(
		() => (sortOptions.length > 0 ? sortOptions : [defaultSortOption]),
		[sortOptions, defaultSortOption],
	);

	const [sortId, setSortId] = useState(
		resolvedSortOptions[0]?.id ?? defaultSortOption.id,
	);

	useEffect(() => {
		if (!resolvedSortOptions.some((option) => option.id === sortId)) {
			setSortId(resolvedSortOptions[0]?.id ?? defaultSortOption.id);
		}
	}, [resolvedSortOptions, sortId, defaultSortOption.id]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (nextOpen) {
			setDraftSelected(selected);
			setSearchTerm("");
			setActiveFilters({});
			setShowSelectedOnly(false);
			setSortId(resolvedSortOptions[0]?.id ?? defaultSortOption.id);
		}
		setOpen(nextOpen);
	};

	const selectedOptions = useMemo(
		() => options.filter((option) => selected.includes(option.value as string)),
		[options, selected],
	);
	const previewSelections = selectedOptions.slice(0, previewCount);
	const overflowCount =
		selectedOptions.length > previewCount
			? selectedOptions.length - previewCount
			: 0;

	const baseOptions = filteredOptions ?? options;

	const visibleOptions = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		const activeFilterKeys = Object.entries(activeFilters).filter(
			([, values]) => hasAnyValue(values),
		);

		let next = baseOptions.filter((option) => {
			if (showSelectedOnly && !draftSelected.includes(option.value as string)) {
				return false;
			}
			if (query.length > 0) {
				const haystack = getOptionText(
					option.searchText ?? option.label,
				).toLowerCase();
				if (!haystack.includes(query)) return false;
			}

			if (activeFilterKeys.length === 0) return true;

			return activeFilterKeys.every(([filterId, values]) => {
				const candidateValues = option.filterValues?.[filterId] ?? [];
				return values.some((value) => candidateValues.includes(value));
			});
		});

		const sortOption = resolvedSortOptions.find((item) => item.id === sortId);
		const compare = sortOption?.compare ?? defaultSortOption.compare!;
		next = [...next].sort(compare);

		return next;
	}, [
		baseOptions,
		searchTerm,
		activeFilters,
		sortId,
		resolvedSortOptions,
		defaultSortOption,
		showSelectedOnly,
		draftSelected,
	]);

	const allFilteredSelected =
		visibleOptions.length > 0 &&
		visibleOptions.every((option) =>
			draftSelected.includes(option.value as string),
		);

	const handleToggleOption = (value: string) => {
		if (draftSelected.includes(value)) {
			setDraftSelected(draftSelected.filter((item) => item !== value));
		} else {
			setDraftSelected([...draftSelected, value]);
		}
	};

	const handleToggleAllFiltered = () => {
		if (visibleOptions.length === 0) return;

		if (allFilteredSelected) {
			const filteredValues = new Set(visibleOptions.map((item) => item.value));
			setDraftSelected(
				draftSelected.filter((item) => !filteredValues.has(item)),
			);
		} else {
			const next = new Set(draftSelected);
			visibleOptions.forEach((item) => next.add(item.value as string));
			setDraftSelected(Array.from(next));
		}
	};

	const handleClear = () => {
		setDraftSelected([]);
		setShowSelectedOnly(false);
	};

	const toggleShowSelected = () => {
		setSearchTerm("");
		setShowSelectedOnly((prev) => !prev);
	};

	useEffect(() => {
		if (showSelectedOnly && draftSelected.length === 0) {
			setShowSelectedOnly(false);
		}
	}, [showSelectedOnly, draftSelected.length]);

	const handleCancel = () => {
		setOpen(false);
	};

	const handleApply = () => {
		onChange(draftSelected);
		setOpen(false);
	};

	const updateFilter = (filterId: string, value: string) => {
		setActiveFilters((prev) => {
			const current = new Set(prev[filterId] ?? []);
			if (current.has(value)) {
				current.delete(value);
			} else {
				current.add(value);
			}
			const nextFilters: Record<string, string[]> = {
				...prev,
				[filterId]: Array.from(current),
			};

			filters.forEach((filter) => {
				if (filter.dependsOn !== filterId) return;
				const allowedParents = nextFilters[filterId] ?? [];
				if (allowedParents.length === 0) {
					nextFilters[filter.id] = [];
					return;
				}
				const allowedValues = new Set(
					filter.options
						.filter((option) =>
							allowedParents.includes((option.parentValue as string) ?? ""),
						)
						.map((option) => option.value),
				);
				nextFilters[filter.id] = (nextFilters[filter.id] ?? []).filter(
					// eslint-disable-next-line no-shadow
					(value) => allowedValues.has(value),
				);
			});

			return nextFilters;
		});
	};

	return (
		<div className="flex flex-col gap-2">
			{selectedOptions.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{previewSelections.map((option) => (
						<Badge
							key={option.value as string}
							variant="default"
							className="rounded-full px-3 py-1 text-xs"
						>
							{option.label}
						</Badge>
					))}
					{overflowCount > 0 && (
						<Badge variant="default" className="rounded-full px-3 py-1 text-xs">
							{t("common.multiSelectModal.selectedMore", {
								count: overflowCount,
							})}
						</Badge>
					)}
				</div>
			)}

			<Button
				type="button"
				variant="outline"
				role="combobox"
				disabled={disabled}
				onClick={() => setOpen(true)}
				className={cn(
					"h-14 w-full justify-between rounded-sm border-input bg-background px-3 text-base font-normal",
					selectedOptions.length === 0 && "text-neutral-60",
				)}
			>
				{selectedOptions.length > 0
					? `${selectedOptions.length} selected`
					: placeholder}
				<ChevronDown className="ml-2 h-4 w-4 shrink-0 text-neutral-60" />
			</Button>

			<DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
				<DialogContent variant="multi-select" showBackButton={false}>
					<div className="flex items-center justify-between bg-neutral-5 px-6 py-5">
						<DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
						<div className="body3 text-neutral-60">
							{t("common.multiSelectModal.selectedCount", {
								count: draftSelected.length,
							})}
						</div>
					</div>
					<div
						className={cn(
							"grid gap-0",
							filterPanel || filters.length > 0
								? "md:grid-cols-2"
								: "md:grid-cols-1",
						)}
					>
						{(filterPanel || filters.length > 0) && (
							<div className="">
								{filterPanel ?? (
									<div className="px-6 py-5">
										<div className="flex flex-col gap-4">
											<p className="body3 font-semibold">
												{t("common.multiSelectModal.filtersTitle")}
											</p>
											{filters.map((filter) => (
												<div key={filter.id} className="space-y-2">
													<p className="text-xs font-semibold text-neutral-80">
														{filter.label}
													</p>
													<div className="max-h-48 space-y-2 overflow-y-auto pr-2">
														{(() => {
															const parentValues = filter.dependsOn
																? (activeFilters[filter.dependsOn] ?? [])
																: [];
															const visibleFilterOptions = filter.dependsOn
																? filter.options.filter((option) =>
																		parentValues.includes(
																			(option.parentValue as string) ?? "",
																		),
																	)
																: filter.options;

															if (
																filter.dependsOn &&
																parentValues.length === 0
															) {
																return (
																	<p className="text-xs text-foreground">
																		{t(
																			"common.multiSelectModal.subcategoryHint",
																		)}
																	</p>
																);
															}

															return visibleFilterOptions.map((option) => {
																const isChecked =
																	activeFilters[filter.id]?.includes(
																		option.value as string,
																	) ?? false;
																return (
																	<label
																		key={option.value as string}
																		className="flex items-center gap-2 body3 text-neutral-80"
																	>
																		<Checkbox
																			checked={isChecked}
																			onCheckedChange={() =>
																				updateFilter(
																					filter.id,
																					option.value as string,
																				)
																			}
																		/>

																		<span className="flex-wrap">
																			{option.label}
																		</span>
																	</label>
																);
															});
														})()}
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
						<div className="flex flex-col gap-4 px-6 py-5 bg-secondary">
							<div className="flex flex-col gap-3">
								<Input
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
									placeholder={searchPlaceholder}
									className="h-11 rounded-sm"
								/>

								<div className="flex flex-wrap gap-2">
									<Button
										type="button"
										variant="outline"
										onClick={toggleShowSelected}
										disabled={draftSelected.length === 0}
									>
										{showSelectedOnly
											? t("common.multiSelectModal.actions.showAll")
											: t("common.multiSelectModal.actions.showSelected")}
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={handleToggleAllFiltered}
										disabled={visibleOptions.length === 0}
									>
										{allFilteredSelected
											? t("common.multiSelectModal.actions.clearFiltered")
											: t("common.multiSelectModal.actions.selectFiltered")}
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={handleClear}
										disabled={draftSelected.length === 0}
									>
										{t("common.multiSelectModal.actions.clearAll")}
									</Button>
								</div>
							</div>
							<div className="flex flex-col gap-3 ">
								<div className="body3 text-foreground">
									{t("common.multiSelectModal.resultsCount", {
										count: visibleOptions.length,
									})}
								</div>
								<Select value={sortId} onValueChange={setSortId}>
									<SelectTrigger className="h-10 rounded-sm border-input ">
										<SelectValue
											placeholder={t("common.multiSelectModal.sortBy")}
										/>
									</SelectTrigger>
									<SelectContent>
										{resolvedSortOptions.map((option) => (
											<SelectItem key={option.id} value={option.id}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<SelectableOptionsList
								options={visibleOptions}
								selectedValues={draftSelected}
								containerClassName="max-h-60 md:max-h-180"
								onToggle={handleToggleOption}
								showCheckbox={true}
								emptyText={emptyText}
								variant="panel"
							/>

							<div className="flex flex-col gap-3 py-4 flex-wrap md:flex-row">
								<Button type="button" variant="outline" onClick={handleCancel}>
									{t("common.multiSelectModal.actions.cancel")}
								</Button>
								<Button type="button" onClick={handleApply}>
									{t("common.multiSelectModal.actions.apply")}
								</Button>
							</div>
						</div>
					</div>
				</DialogContent>
			</DialogPrimitive.Root>
		</div>
	);
}
