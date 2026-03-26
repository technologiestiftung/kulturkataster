"use client";

import {
	Fragment,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getExpandedRowModel,
	getSortedRowModel,
	useReactTable,
	type Column,
	type ColumnDef,
	type ColumnPinningState,
	type ExpandedState,
	type FilterFn,
	type SortingFn,
	sortingFns,
	type SortingState,
} from "@tanstack/react-table";
import { SearchInput } from "@/components/ui/search-input";
import { FilterModalWrapper } from "@/components/Filter/FilterModalWrapper";
import Plus from "@/icons/plus.svg";
import Search from "@/icons/search.svg";
import Filter from "@/icons/filter.svg";
import Close from "@/icons/close.svg";
import type { DataTableConfig } from "./types";
import { Label } from "@radix-ui/react-label";
import { cn } from "@/lib/utils";
import { getAccessibleScrollBehavior } from "@/lib/utils/motion";
import ChevronUp from "@/icons/chevron-up.svg";
import ChevronDown from "@/icons/chevron-down.svg";
import Edit from "@/icons/edit.svg";
import Eye from "@/icons/eye.svg";
import ArrowNarrowLeft from "@/icons/arrow-narrow-left.svg";
import ArrowNarrowRight from "@/icons/arrow-narrow-right.svg";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { compareItems, rankItem } from "@tanstack/match-sorter-utils";
import { PrivateBadge } from "@/components/shared/PrivateBadge";

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown =>
	path
		.split(".")
		.reduce(
			(current: unknown, key: string) =>
				(current as Record<string, unknown>)?.[key],
			obj,
		);

export function DataTable<T>({ config }: { config: DataTableConfig<T> }) {
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [expanded, setExpanded] = useState<ExpandedState>({});
	const [headerWidths, setHeaderWidths] = useState<Record<string, number>>({});
	const [hasOverflow, setHasOverflow] = useState(false);
	const [scrollbarWidth, setScrollbarWidth] = useState(0);
	const [scrollMargin, setScrollMargin] = useState(0);
	const tableId = useId();
	const searchInputRef = useRef<HTMLInputElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const tableRef = useRef<HTMLTableElement | null>(null);
	const headerTableRef = useRef<HTMLTableElement | null>(null);
	const headerScrollRef = useRef<HTMLDivElement | null>(null);
	const isSyncingScroll = useRef(false);
	const headerCellRefs = useRef<Record<string, HTMLTableCellElement | null>>(
		{},
	);
	const hasActions = Boolean(
		config.onEdit || config.onReview || config.rowActions,
	);
	const hasExpandedRow = Boolean(config.renderExpandedRow);

	const actionsColumnId = "__actions__";
	const globalSearchColumnId = "__global__";
	const expandColumnId = "__expand__";

	const normalizedColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
		return config.columns.map((column, index) => {
			const accessorKey =
				"accessorKey" in column ? column.accessorKey : undefined;
			let id = column.id;
			if (!id) {
				if (typeof accessorKey === "string") {
					id = accessorKey;
				} else if (typeof accessorKey === "number") {
					id = String(accessorKey);
				} else {
					id = `col_${index}`;
				}
			}
			return {
				...column,
				id,
				enableGlobalFilter: column.enableGlobalFilter ?? false,
			};
		});
	}, [config.columns]);

	const fuzzyFilter = useCallback<FilterFn<T>>(
		(row, columnId, value, addMeta) => {
			const itemRank = rankItem(String(row.getValue(columnId)), value);
			addMeta({ itemRank });
			return itemRank.passed;
		},
		[],
	);

	const fuzzySort = useCallback<SortingFn<T>>((rowA, rowB, columnId) => {
		const rowAMeta = rowA.columnFiltersMeta[columnId]?.itemRank;
		const rowBMeta = rowB.columnFiltersMeta[columnId]?.itemRank;
		if (rowAMeta && rowBMeta) {
			const direction = compareItems(rowAMeta, rowBMeta);
			if (direction !== 0) return direction;
		}
		return sortingFns.alphanumeric(rowA, rowB, columnId);
	}, []);

	const globalSearchColumn = useMemo<ColumnDef<T, unknown> | null>(() => {
		if (!config.searchable) return null;
		return {
			id: globalSearchColumnId,
			header: "",
			enableSorting: true,
			enableGlobalFilter: true,
			filterFn: fuzzyFilter,
			sortingFn: fuzzySort,
			accessorFn: (row, rowIndex) => {
				const values = config.getSearchableValues
					? config.getSearchableValues(row)
					: normalizedColumns.map((column, _) => {
							if (
								"accessorFn" in column &&
								typeof column.accessorFn === "function"
							) {
								const value = column.accessorFn(row, rowIndex);
								return value ? String(value) : "";
							}
							if ("accessorKey" in column && column.accessorKey) {
								const value = getNestedValue(
									row as Record<string, unknown>,
									String(column.accessorKey),
								);
								return value ? String(value) : "";
							}
							if (column.id) {
								const value = (row as Record<string, unknown>)[column.id];
								return value ? String(value) : "";
							}
							return "";
						});
				const rowKey = config.getRowKey(row);
				return [...values, String(rowKey)].filter(Boolean).join(" ");
			},
		};
	}, [config, fuzzyFilter, fuzzySort, globalSearchColumnId, normalizedColumns]);

	const expandColumn = useMemo<ColumnDef<T, unknown> | null>(() => {
		if (!hasExpandedRow) return null;
		return {
			id: expandColumnId,
			header: "",
			enableSorting: false,
			enableGlobalFilter: false,
			size: 38,
			accessorFn: () => null,
			meta: { pin: "left" },
			cell: ({ row }) =>
				row.getCanExpand() ? (
					<button
						type="button"
						onClick={row.getToggleExpandedHandler()}
						className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-20 bg-background hover:bg-neutral-5"
						aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
					>
						<ChevronDown
							className={cn(
								"size-4 text-neutral-80 transition-transform",
								row.getIsExpanded() ? "rotate-180" : "rotate-0",
							)}
						/>
					</button>
				) : null,
		};
	}, [expandColumnId, hasExpandedRow]);

	const renderEmptyValue = () => <span className="text-foreground">—</span>;

	const columns = useMemo<ColumnDef<T, unknown>[]>(() => {
		const baseColumns = [
			...(expandColumn ? [expandColumn] : []),
			...(globalSearchColumn ? [globalSearchColumn] : []),
			...normalizedColumns,
		];
		if (!hasActions) return baseColumns;
		return [
			...baseColumns,
			{
				id: actionsColumnId,
				header: "",
				enableSorting: false,
				size: 100,
				cell: ({ row }) =>
					config.rowActions ? config.rowActions(row.original) : null,
			},
		];
	}, [
		actionsColumnId,
		expandColumn,
		globalSearchColumn,
		hasActions,
		normalizedColumns,
		config.rowActions,
	]);

	const getColumnId = (column: ColumnDef<T, unknown>, index: number) => {
		const accessorKey =
			"accessorKey" in column ? column.accessorKey : undefined;
		if (column.id) return column.id;
		if (typeof accessorKey === "string") return accessorKey;
		if (typeof accessorKey === "number") return String(accessorKey);
		return `col_${index}`;
	};

	const columnPinning = useMemo<ColumnPinningState>(() => {
		const left = normalizedColumns
			.filter((column) => column.meta?.pin === "left")
			.map((col, index) => getColumnId(col, index));
		const leftPinned = expandColumn ? [expandColumnId, ...left] : left;
		const right = normalizedColumns
			.filter((column) => column.meta?.pin === "right")
			.map((col, index) => getColumnId(col, index));
		const rightPinned = hasActions ? [...right, actionsColumnId] : right;
		return { left: leftPinned, right: rightPinned };
	}, [
		actionsColumnId,
		expandColumn,
		expandColumnId,
		normalizedColumns,
		hasActions,
	]);

	const table = useReactTable<T>({
		data: config.data,
		columns,
		state: {
			sorting,
			columnPinning,
			globalFilter,
			columnVisibility: config.searchable
				? { [globalSearchColumnId]: false }
				: undefined,
			expanded,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		onExpandedChange: setExpanded,
		getRowId: (row) => String(config.getRowKey(row)),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		enableColumnPinning: true,
		enableGlobalFilter: Boolean(config.searchable),
		getRowCanExpand: (() => {
			if (config.getRowCanExpand) {
				return (row) => config.getRowCanExpand?.(row.original as T) ?? false;
			}
			if (hasExpandedRow) {
				return () => true;
			}
			return undefined;
		})(),
		filterFns: {
			fuzzy: fuzzyFilter,
		},
		globalFilterFn: fuzzyFilter,
		sortingFns: {
			fuzzy: fuzzySort,
		},
	});

	useEffect(() => {
		if (!config.searchable) return;
		if (globalFilter && sorting.length === 0) {
			setSorting([{ id: globalSearchColumnId, desc: false }]);
			return;
		}
		if (
			!globalFilter &&
			sorting.length === 1 &&
			sorting[0]?.id === globalSearchColumnId
		) {
			setSorting([]);
		}
	}, [config.searchable, globalFilter, globalSearchColumnId, sorting]);

	const shouldVirtualize =
		Boolean(config.virtualization?.enabled) && !hasExpandedRow;
	const rowHeight = config.virtualization?.rowHeight ?? 56;
	const overscan = config.virtualization?.overscan ?? 8;
	const hasPinnedRight = table.getIsSomeColumnsPinned("right");
	const hasPinnedLeft = table.getIsSomeColumnsPinned("left");
	const rowVirtualizer = useWindowVirtualizer({
		count: table.getRowModel().rows.length,
		estimateSize: () => rowHeight,
		overscan,
		scrollMargin,
		enabled: shouldVirtualize,
	});

	const updateHeaderWidths = useCallback(() => {
		setHeaderWidths((prev) => {
			let changed = false;
			const next = { ...prev };
			Object.entries(headerCellRefs.current).forEach(([id, cell]) => {
				if (!cell) return;
				const width = Math.round(cell.getBoundingClientRect().width);
				if (width > 0 && next[id] !== width) {
					next[id] = width;
					changed = true;
				}
			});
			return changed ? next : prev;
		});
	}, []);

	useEffect(() => {
		const tableNode = headerTableRef.current;
		const containerNode = containerRef.current;
		if (!tableNode || !containerNode) return;
		const updateScrollMargin = () => {
			const rect = containerNode.getBoundingClientRect();
			setScrollMargin(rect.top + window.scrollY);
		};
		updateHeaderWidths();
		updateScrollMargin();
		const observer = new ResizeObserver(() => {
			updateHeaderWidths();
			setHasOverflow(containerNode.scrollWidth - containerNode.clientWidth > 8);
			setScrollbarWidth(
				Math.max(0, containerNode.offsetWidth - containerNode.clientWidth),
			);
			updateScrollMargin();
		});
		observer.observe(tableNode);
		observer.observe(containerNode);
		window.addEventListener("resize", updateScrollMargin);
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", updateScrollMargin);
		};
	}, [updateHeaderWidths, columns]);

	const scrollByColumns = useCallback((direction: "left" | "right") => {
		const container = containerRef.current;
		if (!container) return;
		const firstRow = tableRef.current?.querySelector("tr");
		const columnCount = firstRow?.children.length || 6;
		const approxColWidth =
			container.clientWidth / Math.max(1, Math.min(columnCount, 5));
		const offset = approxColWidth * 3;
		container.scrollBy({
			left: direction === "right" ? offset : -offset,
			behavior: getAccessibleScrollBehavior(),
		});
	}, []);

	const handleBodyScroll = useCallback(() => {
		if (isSyncingScroll.current) return;
		const headerNode = headerScrollRef.current;
		const bodyNode = containerRef.current;
		if (!headerNode || !bodyNode) return;
		isSyncingScroll.current = true;
		headerNode.scrollLeft = bodyNode.scrollLeft;
		requestAnimationFrame(() => {
			isSyncingScroll.current = false;
		});
	}, []);

	const handleHeaderScroll = useCallback(() => {
		if (isSyncingScroll.current) return;
		const headerNode = headerScrollRef.current;
		const bodyNode = containerRef.current;
		if (!headerNode || !bodyNode) return;
		isSyncingScroll.current = true;
		bodyNode.scrollLeft = headerNode.scrollLeft;
		requestAnimationFrame(() => {
			isSyncingScroll.current = false;
		});
	}, []);

	const getHeaderId = useCallback(
		(columnId: string) => `${tableId}-header-${columnId}`,
		[tableId],
	);

	const pinnedOffsets = useMemo(() => {
		const visibleColumns = table.getVisibleLeafColumns();
		const leftPinned = visibleColumns.filter(
			(col) => col.getIsPinned() === "left",
		);
		const rightPinned = visibleColumns.filter(
			(col) => col.getIsPinned() === "right",
		);

		const leftOffsets = new Map<string, number>();
		let leftTotal = 0;
		leftPinned.forEach((col) => {
			leftOffsets.set(col.id, leftTotal);
			leftTotal += headerWidths[col.id] ?? 0;
		});

		const rightOffsets = new Map<string, number>();
		let rightTotal = 0;
		for (let i = rightPinned.length - 1; i >= 0; i -= 1) {
			const col = rightPinned[i];
			rightOffsets.set(col.id, rightTotal);
			rightTotal += headerWidths[col.id] ?? 0;
		}

		return { leftOffsets, rightOffsets };
	}, [headerWidths, table]);

	const getPinningStyles = (column: Column<T, unknown>, isHeader: boolean) => {
		const pinned = column.getIsPinned();
		if (!pinned) {
			return {
				className: isHeader ? "" : "relative",
			};
		}
		const isLeft = pinned === "left";
		const offset = isLeft
			? (pinnedOffsets.leftOffsets.get(column.id) ?? 0)
			: (pinnedOffsets.rightOffsets.get(column.id) ?? 0);
		return {
			className: cn(
				"sticky",
				isLeft ? "left-0" : "right-0",
				isHeader ? "z-40 " : "z-30",
			),
			style: { [isLeft ? "left" : "right"]: offset },
		};
	};

	const renderSortIndicator = (direction: false | "asc" | "desc") => {
		if (direction === "asc") {
			return <ChevronUp className="size-4 text-foreground" />;
		}
		if (direction === "desc") {
			return <ChevronDown className="size-4 text-foreground" />;
		}
		return <ChevronUp className="size-4 text-foreground opacity-0" />;
	};

	const getAriaSort = (direction: false | "asc" | "desc") => {
		if (direction === "asc") return "ascending";
		if (direction === "desc") return "descending";
		return "none";
	};

	const renderHeaderRows = useCallback(
		({
			withRefs,
			withHeaderIds,
			interactive,
			className,
		}: {
			withRefs: boolean;
			withHeaderIds: boolean;
			interactive: boolean;
			className?: string;
		}) => (
			<thead className={cn("bg-neutral-5", className)}>
				{table.getHeaderGroups().map((headerGroup) => (
					<tr key={headerGroup.id}>
						{headerGroup.headers.map((header) => {
							const isActions = header.column.id === actionsColumnId;
							const canSort = header.column.getCanSort();
							const sorted = header.column.getIsSorted();
							const pinning = getPinningStyles(header.column, true);
							const isPinnedRight = header.column.getIsPinned() === "right";
							const isLastCenterColumn =
								header.column.getIsLastColumn("center");
							const isFirstRightColumn =
								header.column.getIsFirstColumn("right");
							const isFirstCenterColumn =
								header.column.getIsFirstColumn("center");
							const setHeaderRef = (node: HTMLTableCellElement | null) => {
								headerCellRefs.current[header.column.id] = node;
							};
							const headerContent = header.isPlaceholder
								? null
								: flexRender(
										header.column.columnDef.header,
										header.getContext(),
									);
							const isPrivateColumn =
								!isActions &&
								(config.isPrivateColumn?.(header.column.id) ?? false);
							const privateColumnIndicator = isPrivateColumn
								? (config.renderPrivateColumnIndicator?.(header.column.id) ?? (
										<PrivateBadge />
									))
								: null;
							const isPinnedLeft = header.column.getIsPinned() === "left";
							const toggleSorting = header.column.getToggleSortingHandler();
							const baseClassName = cn(
								"h-12 px-4 text-left align-middle text-foreground bg-neutral-5",
								"border-b border-r border-neutral-20 first:border-l",
								isLastCenterColumn && hasPinnedRight && "border-r-0",
								isFirstCenterColumn && hasPinnedLeft && "border-l-0",
								isActions && "text-right",
								isPinnedLeft && "bg-neutral-20",
								isPinnedRight && isFirstRightColumn && "border-l",
								pinning.className,
								canSort && "cursor-pointer select-none",
							);
							return (
								<th
									key={header.id}
									ref={withRefs ? setHeaderRef : undefined}
									id={withHeaderIds ? getHeaderId(header.column.id) : undefined}
									className={baseClassName}
									style={pinning.style}
									scope="col"
									aria-sort={canSort ? getAriaSort(sorted) : undefined}
									onClick={interactive && canSort ? toggleSorting : undefined}
									onKeyDown={
										interactive && canSort
											? (event) => {
													if (event.key === "Enter" || event.key === " ") {
														event.preventDefault();
														toggleSorting?.(event);
													}
												}
											: undefined
									}
									tabIndex={interactive && canSort ? 0 : undefined}
								>
									{isActions ? (
										<div
											className={cn(
												"flex items-center justify-center gap-2",
												hasOverflow
													? "opacity-100"
													: "opacity-0 pointer-events-none",
											)}
										>
											<button
												type="button"
												onClick={(event) => {
													event.stopPropagation();
													scrollByColumns("left");
												}}
												aria-label="Scroll left"
											>
												<ArrowNarrowLeft className="text-primary-dark size-6" />
											</button>
											<button
												type="button"
												onClick={(event) => {
													event.stopPropagation();
													scrollByColumns("right");
												}}
												aria-label="Scroll right"
											>
												<ArrowNarrowRight className="text-primary-dark size-6" />
											</button>
										</div>
									) : (
										<div className="flex flex-col">
											<div className="flex items-center gap-2">
												{headerContent}
												{canSort ? renderSortIndicator(sorted) : null}
											</div>
											<div className="flex items-center text-neutral-80 gap-2 font-medium">
												{privateColumnIndicator}
											</div>
										</div>
									)}
								</th>
							);
						})}
					</tr>
				))}
			</thead>
		),
		[
			actionsColumnId,
			getAriaSort,
			getHeaderId,
			getPinningStyles,
			hasOverflow,
			hasPinnedLeft,
			hasPinnedRight,
			renderSortIndicator,
			scrollByColumns,
			table,
		],
	);

	const searchPlaceholder = config.searchPlaceholder || "Search...";
	const searchLabel = searchPlaceholder.replace(/\.\.\.$/, "");
	const primaryButtonAriaLabel =
		typeof config.primaryButton?.label === "string"
			? config.primaryButton.label
			: undefined;
	const secondaryButtonAriaLabel =
		typeof config.secondaryButton?.label === "string"
			? config.secondaryButton.label
			: undefined;
	const filterButtonAriaLabel = (() => {
		if (typeof config.filterModal?.triggerAriaLabel === "string") {
			return config.filterModal.triggerAriaLabel;
		}
		if (typeof config.filterModal?.triggerLabel === "string") {
			return config.filterModal.triggerLabel;
		}
		return "Open filters";
	})();
	const hasRows = table.getRowModel().rows.length > 0;
	const showStandaloneEmptyState = !hasRows && Boolean(config.emptyState);

	useEffect(() => {
		if (!isSearchOpen) return;
		const handle = requestAnimationFrame(() => {
			searchInputRef.current?.focus();
		});
		return () => cancelAnimationFrame(handle);
	}, [isSearchOpen]);

	return (
		<div className="w-full space-y-4">
			{(config.title ||
				config.searchable ||
				config.primaryButton ||
				config.secondaryButton ||
				config.filterModal) && (
				<div className="flex flex-col gap-4 w-full">
					{config.title && (
						<div>
							<h2>{config.title}</h2>
							{config.subtitle && (
								<p className="text-foreground">{config.subtitle}</p>
							)}
						</div>
					)}

					<div className="flex w-full overflow-x-auto relative justify-center items-center flex-row gap-2 px-2 md:px-0">
						{!isSearchOpen && config.primaryButton && (
							<Button
								onClick={config.primaryButton.onClick}
								radius="full"
								variant="surface"
								className="bg-primary shrink-0"
								iconSize="lg"
								aria-label={primaryButtonAriaLabel}
							>
								<Plus className="size-6" />
							</Button>
						)}
						{!isSearchOpen && config.secondaryButton && (
							<Button
								onClick={config.secondaryButton.onClick}
								variant="outline"
								size="lg"
								className="bg-primary-light  max-w-56 text-foreground border-primary rounded-full [&_svg]:size-6"
								aria-label={secondaryButtonAriaLabel}
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
									<SearchInput
										ref={searchInputRef}
										placeholder={searchPlaceholder}
										value={globalFilter}
										onChange={(e) => setGlobalFilter(e.target.value)}
										icon={<Search className="size-4 text-foreground" />}
										rightSlot={
											<button
												type="button"
												onClick={() => {
													setGlobalFilter("");
													setIsSearchOpen(false);
												}}
												className="absolute right-6 top-1/2 -translate-y-1/2 text-foreground hover:text-foreground transition-colors"
												aria-label="Close search"
											>
												<Close className="size-4" />
											</button>
										}
									/>
								</div>
								{!isSearchOpen && (
									<div className="gap-2 flex items-center">
										<Button
											type="button"
											radius="full"
											variant="surface"
											iconSize="lg"
											onClick={() => setIsSearchOpen(true)}
										>
											<Search className="size-5!" />
										</Button>
										<Label className="md:block hidden">{searchLabel}</Label>
									</div>
								)}
								{!isSearchOpen && config.filterModal && (
									<div className="gap-2 flex items-center">
										<Button
											type="button"
											onClick={() => setIsFilterOpen(true)}
											radius="full"
											variant="surface"
											iconSize="lg"
											aria-label={filterButtonAriaLabel}
										>
											<Filter className="size-5!" />
										</Button>
										<Label className="md:block hidden">
											{config.filterModal.triggerLabel ?? "Filter"}
										</Label>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}

			{showStandaloneEmptyState ? (
				<div className="w-full h-full">{config.emptyState}</div>
			) : (
				<div className="relative w-full border border-neutral-20 rounded-md">
					<div
						ref={headerScrollRef}
						onScroll={handleHeaderScroll}
						className="sticky top-0 z-40 overflow-x-auto bg-neutral-5 no-scrollbar"
						style={{ paddingRight: scrollbarWidth }}
						aria-hidden="true"
					>
						<table
							ref={headerTableRef}
							className="w-full table-fixed caption-bottom body3 border-separate border-spacing-0"
							role="presentation"
						>
							<colgroup>
								{table.getVisibleLeafColumns().map((column) => {
									const width =
										headerWidths[column.id] ?? column.columnDef.size;
									return (
										<col
											key={column.id}
											style={
												typeof width === "number"
													? { width: `${width}px` }
													: undefined
											}
										/>
									);
								})}
							</colgroup>
							{renderHeaderRows({
								withRefs: true,
								withHeaderIds: false,
								interactive: true,
							})}
						</table>
					</div>

					<div
						ref={containerRef}
						onScroll={handleBodyScroll}
						className="overflow-x-auto"
					>
						<table
							ref={tableRef}
							className="w-full table-fixed caption-bottom body3 border-separate border-spacing-0"
						>
							<colgroup>
								{table.getVisibleLeafColumns().map((column) => {
									const width =
										headerWidths[column.id] ?? column.columnDef.size;
									return (
										<col
											key={column.id}
											style={
												typeof width === "number"
													? { width: `${width}px` }
													: undefined
											}
										/>
									);
								})}
							</colgroup>
							{renderHeaderRows({
								withRefs: false,
								withHeaderIds: true,
								interactive: false,
								className: "sr-only",
							})}
							<tbody>
								{hasRows ? (
									(() => {
										const rows = table.getRowModel().rows;
										const virtualRows = shouldVirtualize
											? rowVirtualizer.getVirtualItems()
											: rows.map((_, index) => ({
													index,
													start: 0,
													size: rowHeight,
												}));
										const totalSize = shouldVirtualize
											? rowVirtualizer.getTotalSize()
											: rows.length * rowHeight;
										const paddingTop = shouldVirtualize
											? Math.max(0, (virtualRows[0]?.start ?? 0) - scrollMargin)
											: 0;
										const lastVirtualRow = virtualRows[virtualRows.length - 1];
										const paddingBottom = shouldVirtualize
											? totalSize -
												((lastVirtualRow?.start ?? 0) +
													(lastVirtualRow?.size ?? 0) -
													scrollMargin)
											: 0;
										const colSpan = table.getVisibleLeafColumns().length;

										return (
											<Fragment key={colSpan}>
												{paddingTop > 0 ? (
													<tr aria-hidden="true">
														<td
															style={{ height: paddingTop }}
															colSpan={colSpan}
															className="p-0 border-0"
														/>
													</tr>
												) : null}
												{virtualRows.map((virtualRow) => {
													const row = rows[virtualRow.index];
													if (!row) return null;
													const rowIndex = virtualRow.index;
													return (
														<Fragment key={row.id}>
															<tr
																data-index={virtualRow.index}
																ref={
																	shouldVirtualize
																		? rowVirtualizer.measureElement
																		: undefined
																}
																className={cn(
																	"transition-colors hover:bg-neutral-5/80",
																	rowIndex % 2 === 0
																		? "bg-background"
																		: "bg-neutral-5",
																)}
																style={
																	shouldVirtualize
																		? undefined
																		: { height: rowHeight }
																}
															>
																{row.getVisibleCells().map((cell) => {
																	const isActions =
																		cell.column.id === actionsColumnId;
																	const pinning = getPinningStyles(
																		cell.column,
																		false,
																	);
																	const isPinnedLeft =
																		cell.column.getIsPinned() === "left";
																	const isPinnedRight =
																		cell.column.getIsPinned() === "right";
																	const isLastCenterColumn =
																		cell.column.getIsLastColumn("center");
																	const isFirstRightColumn =
																		cell.column.getIsFirstColumn("right");
																	const isFirstCenterColumn =
																		cell.column.getIsFirstColumn("center");
																	const content = flexRender(
																		cell.column.columnDef.cell,
																		cell.getContext(),
																	);
																	const rawValue = cell.getValue();
																	const shouldTruncate = Boolean(
																		cell.column.columnDef.meta?.truncate,
																	);
																	const cellClassName = cn(
																		"p-4 align-middle",
																		"border-b border-r border-neutral-20 first:border-l",
																		shouldTruncate && "truncate",
																		isLastCenterColumn &&
																			hasPinnedRight &&
																			"border-r-0",
																		isFirstCenterColumn &&
																			hasPinnedLeft &&
																			"border-l-0",
																		pinning.className,
																		isPinnedLeft &&
																			(rowIndex % 2 === 0
																				? "bg-neutral-5"
																				: "bg-neutral-10"),
																		isPinnedRight &&
																			(rowIndex % 2 === 0
																				? "bg-background"
																				: "bg-neutral-5"),
																		isPinnedRight &&
																			(isFirstRightColumn ? "border-l" : null),
																	);
																	if (isActions) {
																		return (
																			<td
																				key={cell.id}
																				className={cn(
																					cellClassName,
																					"text-right",
																				)}
																				style={pinning.style}
																				headers={getHeaderId(cell.column.id)}
																			>
																				<div className="flex flex-wrap justify-center gap-2">
																					{content}
																					{config.onReview &&
																					(config.getCanReview?.(
																						row.original,
																					) ??
																						true) ? (
																						<Button
																							iconSize="sm"
																							variant="surface"
																							radius="full"
																							onClick={(event) => {
																								event.stopPropagation();
																								config.onReview?.(row.original);
																							}}
																							aria-label={
																								config.reviewAriaLabel ??
																								"Review"
																							}
																						>
																							<Eye />
																						</Button>
																					) : null}
																					{config.onEdit &&
																					(config.getCanEdit?.(row.original) ??
																						true) ? (
																						<Button
																							iconSize="sm"
																							variant="surface"
																							radius="full"
																							onClick={(event) => {
																								event.stopPropagation();
																								config.onEdit?.(row.original);
																							}}
																							aria-label="Edit"
																						>
																							<Edit className="h-5 w-5 text-neutral-80" />
																						</Button>
																					) : null}
																				</div>
																			</td>
																		);
																	}
																	return (
																		<td
																			key={cell.id}
																			className={cellClassName}
																			style={pinning.style}
																			headers={getHeaderId(cell.column.id)}
																		>
																			{content ??
																				(cell.column.id !== expandColumnId &&
																				rawValue === null
																					? renderEmptyValue()
																					: null)}
																		</td>
																	);
																})}
															</tr>
															{hasExpandedRow && row.getIsExpanded() ? (
																<tr>
																	<td
																		colSpan={
																			table.getVisibleLeafColumns().length
																		}
																		className="border-b border-r border-neutral-20 first:border-l bg-background"
																	>
																		{config.renderExpandedRow?.(row.original)}
																	</td>
																</tr>
															) : null}
														</Fragment>
													);
												})}
												{paddingBottom > 0 ? (
													<tr aria-hidden="true">
														<td
															style={{ height: paddingBottom }}
															colSpan={colSpan}
															className="p-0 border-0"
														/>
													</tr>
												) : null}
											</Fragment>
										);
									})()
								) : (
									<tr>
										<td
											colSpan={table.getVisibleLeafColumns().length}
											className="h-24 text-center border-b border-r border-neutral-20 first:border-l"
										>
											{config.emptyMessage ?? "No data found."}
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}
			{config.filterModal ? (
				<FilterModalWrapper
					open={isFilterOpen}
					onOpenChange={setIsFilterOpen}
					title={
						config.filterModal.title ??
						config.filterModal.triggerLabel ??
						"Filter"
					}
					description={config.filterModal.description}
				>
					{typeof config.filterModal.content === "function"
						? config.filterModal.content({
								close: () => setIsFilterOpen(false),
							})
						: config.filterModal.content}
				</FilterModalWrapper>
			) : null}
		</div>
	);
}
