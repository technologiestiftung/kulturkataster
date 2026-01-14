"use client";

import { useState, useMemo } from "react";
import {
	StickyTable,
	StickyTableBody,
	StickyTableHead,
	StickyTableHeader,
	StickyTableRow,
	StickyTableCell,
	StickyActionsHead,
	StickyActionsCell,
} from "@/components/ui/sticky-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Plus from "@/icons/plus.svg";
import Search from "@/icons/search.svg";
import Close from "@/icons/close.svg";
import type { DataTableConfig, SortState } from "./types";
import { extractValue, formatDisplayValue, compareValues } from "./utils";
import { SortableTableHead } from "./SortableTableHead";
import { Label } from "@radix-ui/react-label";

export function DataTable<T>({ config }: { config: DataTableConfig<T> }) {
	const [searchTerm, setSearchTerm] = useState("");
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [sortState, setSortState] = useState<SortState>({
		column: null,
		direction: null,
	});

	const handleSort = (column: string) => {
		if (sortState.column === column) {
			if (sortState.direction === "asc") {
				setSortState({ column, direction: "desc" });
			} else if (sortState.direction === "desc") {
				setSortState({ column: null, direction: null });
			}
		} else {
			setSortState({ column, direction: "asc" });
		}
	};

	const filteredData = useMemo(() => {
		if (!config.searchable || !searchTerm.trim()) {
			return config.data;
		}

		const term = searchTerm.trim().toLowerCase();

		return config.data.filter((row) => {
			const searchValues = config.getSearchableValues
				? config.getSearchableValues(row)
				: config.columns.map((col) => {
						const value = extractValue(row, col);
						return value ? String(value) : "";
					});

			return searchValues.some((value) => value.toLowerCase().includes(term));
		});
	}, [config, searchTerm]);

	const sortedData = useMemo(() => {
		if (!sortState.column || !sortState.direction) {
			return filteredData;
		}

		const column = config.columns.find((col) => col.key === sortState.column);
		if (!column) return filteredData;

		return [...filteredData].sort((a, b) => {
			const comparison = column.compare
				? column.compare(a, b)
				: compareValues(extractValue(a, column), extractValue(b, column));

			return sortState.direction === "asc" ? comparison : -comparison;
		});
	}, [filteredData, sortState, config.columns]);

	const renderCell = (row: T, column: (typeof config.columns)[number]) => {
		if (column.render) {
			return column.render(row);
		}

		const value = extractValue(row, column);
		return formatDisplayValue(value);
	};

	const searchPlaceholder = config.searchPlaceholder || "Search...";
	const searchLabel = searchPlaceholder.replace(/\.\.\.$/, "");

	return (
		<div className="w-full space-y-4">
			{(config.title ||
				config.searchable ||
				config.primaryButton ||
				config.secondaryButton) && (
				<div className="flex flex-col gap-4 w-full">
					{config.title && (
						<div>
							<h2>{config.title}</h2>
							{config.subtitle && (
								<p className="text-foreground">{config.subtitle}</p>
							)}
						</div>
					)}

					<div className="flex w-full relative flex-col md:flex-row gap-2">
						{!isSearchOpen && config.primaryButton && (
							<Button
								onClick={config.primaryButton.onClick}
								variant="rounded"
								className="bg-primary"
								size="icon"
								aria-label={config.primaryButton.label}
							>
								<Plus className="size-6" />
							</Button>
						)}
						{!isSearchOpen && config.secondaryButton && (
							<Button
								onClick={config.secondaryButton.onClick}
								variant="outline"
								size="md"
								className="bg-primary-light flex-0 text-foreground border-primary rounded-full"
								aria-label={config.secondaryButton.label}
							>
								{config.secondaryButton.label}
							</Button>
						)}
						{config.searchable && (
							<div className="relative flex flex-1 items-center gap-2">
								<div
									className={[
										"relative flex-1 transition-all duration-200 ease-out",
										isSearchOpen
											? "w-full max-w-full opacity-100"
											: "max-w-0 opacity-0 pointer-events-none",
									]
										.filter(Boolean)
										.join(" ")}
								>
									<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground">
										<Search className="size-4" />
									</span>
									<Input
										placeholder={searchPlaceholder}
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="h-10 w-full rounded-full pl-9 pr-10"
									/>
									<button
										type="button"
										onClick={() => {
											setSearchTerm("");
											setIsSearchOpen(false);
										}}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground hover:text-foreground transition-colors"
										aria-label="Close search"
									>
										<Close className="size-4" />
									</button>
								</div>
								{isSearchOpen ? null : (
									<div className="gap-2 flex items-center">
										<Button
											type="button"
											variant="icon"
											size="icon"
											className="bg-secondary border-border"
											onClick={() => setIsSearchOpen(true)}
										>
											<Search className="size-4" />
										</Button>
										<Label>{searchLabel}</Label>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}

			<div className="rounded-md border">
				<StickyTable>
					<StickyTableHeader>
						<StickyTableRow>
							{config.columns.map((column) =>
								column.sortable !== false ? (
									<SortableTableHead
										key={column.key}
										column={column.key}
										currentSortColumn={sortState.column}
										currentSortDirection={sortState.direction}
										onSort={handleSort}
										HeadComponent={StickyTableHead}
									>
										{column.label}
									</SortableTableHead>
								) : (
									<StickyTableHead key={column.key}>
										{column.label}
									</StickyTableHead>
								),
							)}
							{(config.onEdit || config.rowActions) && <StickyActionsHead />}
						</StickyTableRow>
					</StickyTableHeader>
					<StickyTableBody>
						{sortedData.length > 0 ? (
							sortedData.map((row) => (
								<StickyTableRow key={config.getRowKey(row)}>
									{config.columns.map((column) => (
										<StickyTableCell key={column.key}>
											{renderCell(row, column)}
										</StickyTableCell>
									))}
									{(config.onEdit || config.rowActions) && (
										<StickyActionsCell
											onEdit={
												config.onEdit ? () => config.onEdit!(row) : undefined
											}
										>
											{config.rowActions && config.rowActions(row)}
										</StickyActionsCell>
									)}
								</StickyTableRow>
							))
						) : (
							<StickyTableRow>
								<StickyTableCell
									colSpan={
										config.columns.length +
										(config.onEdit || config.rowActions ? 1 : 0)
									}
									className="h-24 text-center"
								>
									{config.emptyMessage || "No data found."}
								</StickyTableCell>
							</StickyTableRow>
						)}
					</StickyTableBody>
				</StickyTable>
			</div>
		</div>
	);
}
