"use client";
import * as React from "react";
import { Button } from "./button";
import Edit from "@/icons/edit.svg";

import { cn } from "@/lib/utils";
import ArrowNarrowLeft from "@/icons/arrow-narrow-left.svg";
import ArrowNarrowRight from "@/icons/arrow-narrow-right.svg";
type StickyScrollDirection = "left" | "right";

interface StickyTableContextValue {
	scrollByColumns: (direction: StickyScrollDirection) => void;
	hasOverflow: boolean;
}

const StickyTableContext = React.createContext<StickyTableContextValue>({
	scrollByColumns: () => {},
	hasOverflow: false,
});

const useStickyTable = () => React.useContext(StickyTableContext);

interface StickyTableProps extends React.HTMLAttributes<HTMLTableElement> {
	scrollStepColumns?: number;
}

const StickyTable = React.forwardRef<HTMLTableElement, StickyTableProps>(
	({ className, scrollStepColumns = 3, ...props }, forwardedRef) => {
		const containerRef = React.useRef<HTMLDivElement>(null);
		const tableRef = React.useRef<HTMLTableElement>(null);
		const [hasOverflow, setHasOverflow] = React.useState(false);

		const setRefs = (node: HTMLTableElement | null) => {
			tableRef.current = node;
			if (typeof forwardedRef === "function") {
				forwardedRef(node);
			} else if (forwardedRef) {
				(
					forwardedRef as React.MutableRefObject<HTMLTableElement | null>
				).current = node;
			}
		};

		const scrollByColumns = (direction: StickyScrollDirection) => {
			const container = containerRef.current;
			if (!container) return;
			const firstRow = tableRef.current?.querySelector("tr");
			const columnCount = firstRow?.children.length || 6;
			const approxColWidth =
				container.clientWidth / Math.max(1, Math.min(columnCount, 5));
			const offset = approxColWidth * scrollStepColumns;
			container.scrollBy({
				left: direction === "right" ? offset : -offset,
				behavior: "smooth",
			});
		};

		React.useEffect(() => {
			const container = containerRef.current;
			if (!container) return;

			const updateOverflow = () => {
				setHasOverflow(container.scrollWidth - container.clientWidth > 8);
			};

			updateOverflow();
			const observer = new ResizeObserver(updateOverflow);
			observer.observe(container);
			return () => observer.disconnect();
		}, []);

		return (
			<StickyTableContext.Provider value={{ scrollByColumns, hasOverflow }}>
				<div
					ref={containerRef}
					className="relative w-full overflow-auto border border-neutral-20"
				>
					<table
						ref={setRefs}
						className={cn(
							"w-full min-w-[960px] caption-bottom body3 border-collapse",
							className,
						)}
						{...props}
					/>
				</div>
			</StickyTableContext.Provider>
		);
	},
);
StickyTable.displayName = "StickyTable";

const StickyTableHeader = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<thead
		ref={ref}
		className={cn(
			"[&>tr>th]:sticky [&>tr>th]:top-0 [&>tr>th]:z-30 [&>tr>th:first-child]:z-40 [&>tr>th:first-child]:bg-neutral-20 [&>tr>th:not(:first-child)]:bg-neutral-5",
			className,
		)}
		{...props}
	/>
));
StickyTableHeader.displayName = "StickyTableHeader";

const StickyTableBody = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tbody
		ref={ref}
		className={cn(
			"[&_tr:last-child]:border-0",
			"[&>tr:nth-child(odd)>td:first-child]:bg-neutral-5",
			"[&>tr:nth-child(odd)>td:not(:first-child)]:bg-white",
			"[&>tr:nth-child(even)>td:first-child]:bg-neutral-10",
			"[&>tr:nth-child(even)>td:not(:first-child)]:bg-neutral-5",
			"[&>tr>td:first-child]:sticky [&>tr>td:first-child]:left-0 [&>tr>td:first-child]:z-20",
			"[&>tr>td:last-child]:sticky [&>tr>td:last-child]:right-0 [&>tr>td:last-child]:z-20",
			className,
		)}
		{...props}
	/>
));
StickyTableBody.displayName = "StickyTableBody";

const StickyTableFooter = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tfoot
		ref={ref}
		className={cn(
			"border-t bg-muted font-medium [&>tr]:last:border-b-0",
			className,
		)}
		{...props}
	/>
));
StickyTableFooter.displayName = "StickyTableFooter";

const StickyTableRow = React.forwardRef<
	HTMLTableRowElement,
	React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
	<tr
		ref={ref}
		className={cn(
			"transition-colors hover:[&>td:first-child]:bg-neutral-10/80 hover:[&>td:not(:first-child)]:bg-neutral-5/80 data-[state=selected]:bg-muted",
			className,
		)}
		{...props}
	/>
));
StickyTableRow.displayName = "StickyTableRow";

const StickyTableHead = React.forwardRef<
	HTMLTableCellElement,
	React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<th
		ref={ref}
		className={cn(
			"h-12 px-4 text-left align-middle +text-foreground [&:has([role=checkbox])]:pr-0",
			"first:sticky first:left-0 first:z-40 last:sticky last:right-0 last:z-40",
			"border border-neutral-20 first:border-l-0 last:border-r-0",
			className,
		)}
		{...props}
	/>
));
StickyTableHead.displayName = "StickyTableHead";

const StickyTableCell = React.forwardRef<
	HTMLTableCellElement,
	React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<td
		ref={ref}
		className={cn(
			"p-4 align-middle [&:has([role=checkbox])]:pr-0",
			"first:sticky first:left-0 first:z-20 last:sticky last:right-0 last:z-20",
			"border border-neutral-20 first:border-l-0 last:border-r-0",
			className,
		)}
		{...props}
	/>
));
StickyTableCell.displayName = "StickyTableCell";

const StickyTableCaption = React.forwardRef<
	HTMLTableCaptionElement,
	React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
	<caption
		ref={ref}
		className={cn("mt-4 body3 text-foreground", className)}
		{...props}
	/>
));
StickyTableCaption.displayName = "StickyTableCaption";

interface StickyActionsHeadProps
	extends React.ThHTMLAttributes<HTMLTableCellElement> {
	showArrows?: boolean;
}

const StickyActionsHead = React.forwardRef<
	HTMLTableCellElement,
	StickyActionsHeadProps
>(({ className, showArrows = true, ...props }, ref) => {
	const { scrollByColumns, hasOverflow } = useStickyTable();
	return (
		<StickyTableHead
			ref={ref}
			className={cn("text-right border last:border-r-0", className)}
			{...props}
		>
			{showArrows && hasOverflow ? (
				<div className="flex items-center justify-center gap-2">
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
			) : null}
		</StickyTableHead>
	);
});
StickyActionsHead.displayName = "StickyActionsHead";

interface StickyActionsCellProps
	extends React.TdHTMLAttributes<HTMLTableCellElement> {
	onEdit?: () => void;
	editLabel?: string;
	editDisabled?: boolean;
}

const StickyActionsCell = React.forwardRef<
	HTMLTableCellElement,
	StickyActionsCellProps
>(
	(
		{ className, children, onEdit, editLabel = "Edit", editDisabled, ...props },
		ref,
	) => (
		<StickyTableCell
			ref={ref}
			className={cn("border border-neutral-20 last:border-r-0", className)}
			{...props}
		>
			<div className="flex flex-wrap justify-center gap-2">
				{children}
				{onEdit ? (
					<Button
						size="icon"
						variant="ghost"
						disabled={editDisabled}
						onClick={(event) => {
							event.stopPropagation();
							if (!editDisabled) {
								onEdit();
							}
						}}
						className="h-8 w-8 rounded-full border bg-background border-neutral-20 hover:bg-neutral-5"
						aria-label={editLabel}
					>
						<Edit className="h-5 w-5 text-neutral-80" />
					</Button>
				) : null}
			</div>
		</StickyTableCell>
	),
);
StickyActionsCell.displayName = "StickyActionsCell";

export {
	StickyTable,
	StickyTableHeader,
	StickyTableBody,
	StickyTableFooter,
	StickyTableHead,
	StickyTableRow,
	StickyTableCell,
	StickyTableCaption,
	StickyActionsHead,
	StickyActionsCell,
	useStickyTable,
};
