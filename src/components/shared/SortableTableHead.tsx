import * as React from "react";
import { TableHead } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

interface SortableTableHeadProps {
	column: string;
	currentSortColumn: string | null;
	currentSortDirection: SortDirection;
	onSort: (column: string) => void;
	children: React.ReactNode;
	className?: string;
}

export function SortableTableHead({
	column,
	currentSortColumn,
	currentSortDirection,
	onSort,
	children,
	className,
}: SortableTableHeadProps) {
	const isSorted = currentSortColumn === column;

	const getSortIcon = () => {
		if (!isSorted) {
			return <ArrowUpDown className="h-4 w-4 opacity-50" />;
		}
		if (currentSortDirection === "asc") {
			return <ArrowUp className="h-4 w-4" />;
		}
		return <ArrowDown className="h-4 w-4" />;
	};

	return (
		<TableHead className={className}>
			<button
				className="flex items-center gap-2 hover:text-foreground transition-colors"
				onClick={() => onSort(column)}
			>
				{children}
				{getSortIcon()}
			</button>
		</TableHead>
	);
}
