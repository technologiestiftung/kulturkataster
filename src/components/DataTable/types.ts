import { type ColumnDef } from "@tanstack/react-table";

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
		label: string;
		onClick: () => void;
	};

	secondaryButton?: {
		label: string;
		onClick: () => void;
	};

	onEdit?: (row: T) => void;
	rowActions?: (row: T) => React.ReactNode;
	actionsColumnSize?: number;

	enableColumnResizing?: boolean;

	emptyMessage?: string;

	title?: string;
	subtitle?: string;
}
