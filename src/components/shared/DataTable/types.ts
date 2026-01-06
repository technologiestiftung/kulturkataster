import type { SortDirection } from "@/components/shared";

// Generic column configuration
export interface ColumnConfig<T> {
	key: string;
	label: string;
	sortable?: boolean;
	// Function to extract the display value from the row data
	getValue?: (row: T) => string | number | boolean | Date | null;
	// Custom render function for the cell
	render?: (row: T) => React.ReactNode;
	// For nested property access (e.g., "address.city")
	accessor?: string;
	// Comparison function for custom sorting
	compare?: (a: T, b: T) => number;
}

// Configuration for the DataTable component
export interface DataTableConfig<T> {
	// Column definitions
	columns: ColumnConfig<T>[];

	// Data array
	data: T[];

	// Unique key extractor
	getRowKey: (row: T) => string;

	// Search configuration
	searchable?: boolean;
	searchPlaceholder?: string;
	getSearchableValues?: (row: T) => string[];

	// Add button configuration
	addButton?: {
		label: string;
		onClick: () => void;
	};

	// Row actions
	onEdit?: (row: T) => void;
	rowActions?: (row: T) => React.ReactNode;

	// Empty state
	emptyMessage?: string;

	// Header configuration
	title?: string;
	subtitle?: string;
}

// Sort state
export interface SortState {
	column: string | null;
	direction: SortDirection;
}
