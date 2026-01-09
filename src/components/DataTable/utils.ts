/**
 * Helper function to access nested object properties using dot notation
 * @example getNestedValue({ user: { name: 'John' } }, 'user.name') // 'John'
 */
export function getNestedValue(
	obj: Record<string, unknown>,
	path: string,
): unknown {
	return path
		.split(".")
		.reduce(
			(current: unknown, key: string) =>
				(current as Record<string, unknown>)?.[key],
			obj,
		);
}

/**
 * Extract value from a row based on column configuration
 * Tries getValue → accessor → key in that order
 */
export function extractValue<T>(
	row: T,
	column: {
		key: string;
		getValue?: (row: T) => unknown;
		accessor?: string;
	},
): unknown {
	if (column.getValue) {
		return column.getValue(row);
	}

	if (column.accessor) {
		return getNestedValue(row as Record<string, unknown>, column.accessor);
	}

	return (row as Record<string, unknown>)[column.key];
}

/**
 * Format a value for display in a table cell
 * Handles null/undefined, dates, and other types
 */
export function formatDisplayValue(value: unknown): string {
	if (value === null || value === undefined) return "—";
	if (value instanceof Date) return value.toLocaleDateString();
	return String(value);
}

/**
 * Compare two values for sorting with type-aware logic
 * Handles null/undefined, strings, numbers, dates, booleans
 */
export function compareValues(aVal: unknown, bVal: unknown): number {
	if (aVal === null || aVal === undefined) return 1;
	if (bVal === null || bVal === undefined) return -1;

	if (typeof aVal === "string" && typeof bVal === "string") {
		return aVal.localeCompare(bVal);
	}

	if (typeof aVal === "number" && typeof bVal === "number") {
		return aVal - bVal;
	}

	if (aVal instanceof Date && bVal instanceof Date) {
		return aVal.getTime() - bVal.getTime();
	}

	if (typeof aVal === "boolean" && typeof bVal === "boolean") {
		return Number(aVal) - Number(bVal);
	}

	return String(aVal).localeCompare(String(bVal));
}
