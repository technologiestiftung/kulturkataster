export type SortDirection = "asc" | "desc" | null;

export interface ColumnConfig<T> {
	key: string;
	label: string;
	sortable?: boolean;
	getValue?: (row: T) => string | number | boolean | Date | null;
	render?: (row: T) => React.ReactNode;
	accessor?: string;
	compare?: (a: T, b: T) => number;
}

export interface DataTableConfig<T> {
	columns: ColumnConfig<T>[];

	data: T[];

	getRowKey: (row: T) => number | string;

	searchable?: boolean;
	searchPlaceholder?: string;
	getSearchableValues?: (row: T) => string[];

	addButton?: {
		label: string;
		onClick: () => void;
	};

	onEdit?: (row: T) => void;
	rowActions?: (row: T) => React.ReactNode;

	emptyMessage?: string;

	title?: string;
	subtitle?: string;
}

export interface SortState {
	column: string | null;
	direction: SortDirection;
}
