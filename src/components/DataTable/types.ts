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

	filterModal?: {
		triggerLabel?: ReactNode;
		triggerAriaLabel?: string;
		title?: ReactNode;
		description?: ReactNode;
		content: ReactNode | ((api: { close: () => void }) => ReactNode);
	};

	onEdit?: (row: T) => void;
	getCanEdit?: (row: T) => boolean;
	onReview?: (row: T) => void;
	getCanReview?: (row: T) => boolean;
	reviewAriaLabel?: string;
	rowActions?: (row: T) => React.ReactNode;
	actionsColumnSize?: number;

	enableColumnResizing?: boolean;

	emptyMessage?: string;
	emptyState?: ReactNode;

	title?: string;
	subtitle?: string;
}
