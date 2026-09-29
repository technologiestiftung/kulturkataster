import { type ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";

declare module "@tanstack/react-table" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData, TValue> {
		pin?: "left" | "right";
		truncate?: boolean;
		exportKey?: string | string[];
	}
}

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

	rightButton?: {
		label: ReactNode;
		onClick: () => void;
	};

	importButton?: {
		label: string;
		onClick: () => void;
	};

	toolbarContent?: ReactNode;

	filterModal?: {
		triggerLabel?: ReactNode;
		triggerAriaLabel?: string;
		title?: ReactNode;
		description?: ReactNode;
		content: ReactNode | ((api: { close: () => void }) => ReactNode);
	};

	onEdit?: (row: T) => void;
	onEditPrefetch?: (row: T) => void;
	getCanEdit?: (row: T) => boolean;
	onReview?: (row: T) => void;
	onReviewPrefetch?: (row: T) => void;
	getCanReview?: (row: T) => boolean;
	reviewAriaLabel?: string;
	rowActions?: (row: T) => React.ReactNode;
	actionsColumnSize?: number;

	enableColumnResizing?: boolean;
	isPrivateColumn?: (columnId: string) => boolean;
	renderPrivateColumnIndicator?: (columnId: string) => ReactNode;
	privateColumnAriaLabel?: string;

	emptyMessage?: string;
	emptyState?: ReactNode;

	title?: string;
	subtitle?: string;
}
