import { type ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";

export interface DataTableConfig<T> {
	columns: ColumnDef<T, unknown>[];

	data: T[];

	getRowKey: (row: T) => number | string;

	searchable?: boolean;
	searchPlaceholder?: string;
	getSearchableValues: (row: T) => string[];

	virtualization?: {
		enabled?: boolean;
		rowHeight?: number;
		overscan?: number;
	};

	renderExpandedRow?: (row: T) => React.ReactNode;
	getRowCanExpand?: (row: T) => boolean;

	primaryButton?: {
		label: ReactNode;
		onClick: () => void;
	};

	secondaryButton?: {
		label: ReactNode;
		onClick: () => void;
	};

	onEdit?: (row: T) => void;
	onReview?: (row: T) => void;
	getCanReview?: (row: T) => boolean;
	reviewAriaLabel?: string;
	rowActions?: (row: T) => React.ReactNode;
	actionsColumnSize?: number;

	enableColumnResizing?: boolean;

	emptyMessage?: string;

	title?: string;
	subtitle?: string;
}
