/* eslint-disable complexity */
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
import { Plus } from "lucide-react";
import { SortableTableHead } from "@/components/shared";
import type { DataTableConfig, SortState } from "./types";

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
	return path
		.split(".")
		.reduce(
			(current: unknown, key: string) =>
				(current as Record<string, unknown>)?.[key],
			obj,
		);
}

export function DataTable<T>({ config }: { config: DataTableConfig<T> }) {
	const [searchTerm, setSearchTerm] = useState("");
	const [sortState, setSortState] = useState<SortState>({
		column: null,
		direction: null,
	});

	// Handle sorting
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

	// Filter data based on search term
	const filteredData = useMemo(() => {
		if (!config.searchable || !searchTerm.trim()) {
			return config.data;
		}

		const term = searchTerm.trim().toLowerCase();

		return config.data.filter((row) => {
			let searchValues: string[] = [];

			if (config.getSearchableValues) {
				searchValues = config.getSearchableValues(row);
			} else {
				// Default: search all column values
				searchValues = config.columns.map((col) => {
					if (col.getValue) {
						const value = col.getValue(row);
						return value ? String(value) : "";
					}
					if (col.accessor) {
						const value = getNestedValue(
							row as Record<string, unknown>,
							col.accessor,
						);
						return value ? String(value) : "";
					}
					return String((row as Record<string, unknown>)[col.key] || "");
				});
			}

			return searchValues.some((value) => value.toLowerCase().includes(term));
		});
	}, [config, searchTerm]);

	// Sort filtered data
	const sortedData = useMemo(() => {
		if (!sortState.column || !sortState.direction) {
			return filteredData;
		}

		const column = config.columns.find((col) => col.key === sortState.column);
		if (!column) return filteredData;

		return [...filteredData].sort((a, b) => {
			let comparison = 0;

			// Use custom compare function if provided
			if (column.compare) {
				comparison = column.compare(a, b);
			} else if (column.getValue) {
				const aVal = column.getValue(a);
				const bVal = column.getValue(b);

				if (aVal === null || aVal === undefined) return 1;
				if (bVal === null || bVal === undefined) return -1;

				if (typeof aVal === "string" && typeof bVal === "string") {
					comparison = aVal.localeCompare(bVal);
				} else if (typeof aVal === "number" && typeof bVal === "number") {
					comparison = aVal - bVal;
				} else if (aVal instanceof Date && bVal instanceof Date) {
					comparison = aVal.getTime() - bVal.getTime();
				} else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
					comparison = Number(aVal) - Number(bVal);
				} else {
					comparison = String(aVal).localeCompare(String(bVal));
				}
			} else if (column.accessor) {
				const aVal = getNestedValue(
					a as Record<string, unknown>,
					column.accessor,
				);
				const bVal = getNestedValue(
					b as Record<string, unknown>,
					column.accessor,
				);

				if (typeof aVal === "string" && typeof bVal === "string") {
					comparison = aVal.localeCompare(bVal);
				} else {
					comparison = String(aVal).localeCompare(String(bVal));
				}
			} else {
				const aVal = (a as Record<string, unknown>)[column.key];
				const bVal = (b as Record<string, unknown>)[column.key];
				comparison = String(aVal).localeCompare(String(bVal));
			}

			return sortState.direction === "asc" ? comparison : -comparison;
		});
	}, [filteredData, sortState, config.columns]);

	// Render cell content
	const renderCell = (row: T, column: (typeof config.columns)[number]) => {
		if (column.render) {
			return column.render(row);
		}

		if (column.getValue) {
			const value = column.getValue(row);
			if (value === null || value === undefined) return "—";
			if (value instanceof Date) {
				return value.toLocaleDateString();
			}
			return String(value);
		}

		if (column.accessor) {
			const value = getNestedValue(
				row as Record<string, unknown>,
				column.accessor,
			);
			if (value === null || value === undefined) return "—";
			if (value instanceof Date) {
				return value.toLocaleDateString();
			}
			return String(value);
		}

		const value = (row as Record<string, unknown>)[column.key];
		if (value === null || value === undefined) return "—";
		if (value instanceof Date) {
			return value.toLocaleDateString();
		}
		return String(value);
	};

	return (
		<div className="w-full space-y-4">
			{/* Header with title and actions */}
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
								<Plus className="h-4 w-4 mr-2" />
								{config.addButton.label}
							</Button>
						)}
					</div>
				</div>
			)}

			{/* Table */}
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
