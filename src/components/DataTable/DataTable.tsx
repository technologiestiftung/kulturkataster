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
import type { DataTableConfig, SortState } from "./types";
import { extractValue, formatDisplayValue, compareValues } from "./utils";
import { SortableTableHead } from "./SortableTableHead";

export function DataTable<T>({ config }: { config: DataTableConfig<T> }) {
	const [searchTerm, setSearchTerm] = useState("");
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

	return (
		<div className="w-full space-y-4">
			{(config.title || config.searchable || config.addButton) && (
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					{config.title && (
						<div>
							<h2 className="text-2xl font-bold">{config.title}</h2>
							{config.subtitle && (
								<p className="text-muted-foreground">{config.subtitle}</p>
							)}
						</div>
					)}

					<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
						{config.searchable && (
							<Input
								placeholder={config.searchPlaceholder || "Search..."}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full sm:max-w-sm"
							/>
						)}
						{config.addButton && (
							<Button
								onClick={config.addButton.onClick}
								className="w-full sm:w-auto"
							>
								<Plus className="size-4 mr-2" />
								{config.addButton.label}
							</Button>
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
