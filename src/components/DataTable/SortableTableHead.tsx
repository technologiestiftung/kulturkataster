import * as React from "react";
import type { ComponentType } from "react";
import { TableHead } from "@/components/ui/table";
import { SortDirection } from "./types";
import ChevronUp from "@/icons/chevron-up.svg";
import ChevronDown from "@/icons/chevron-down.svg";

interface SortableTableHeadProps {
	column: string;
	currentSortColumn: string | null;
	currentSortDirection: SortDirection;
	onSort: (column: string) => void;
	children: React.ReactNode;
	className?: string;
	HeadComponent?: ComponentType<React.ComponentProps<typeof TableHead>>;
}

export function SortableTableHead({
	column,
	currentSortColumn,
	currentSortDirection,
	onSort,
	children,
	className,
	HeadComponent,
}: SortableTableHeadProps) {
	const isSorted = currentSortColumn === column;
	const Head = HeadComponent ?? TableHead;

	const getSortIcon = () => {
		if (!isSorted) {
			return <ChevronUp className="size-4 opacity-50" />;
		}
		if (currentSortDirection === "asc") {
			return <ChevronUp className="size-4" />;
		}
		return <ChevronDown className="size-4" />;
	};

	return (
		<Head className={className}>
			<button
				className="flex items-center gap-2 hover:text-foreground font-bold transition-colors"
				onClick={() => onSort(column)}
			>
				{children}
				{getSortIcon()}
			</button>
		</Head>
	);
}
