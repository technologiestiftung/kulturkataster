import type { FieldValueType } from "./types";

type FormatOptions = {
	valueType?: FieldValueType;
	enumKey?: string;
	tEnum?: (key: string) => string;
	tCommon?: (key: string) => string;
};

export function hasDisplayValue(value: unknown): boolean {
	if (value === null || value === undefined || value === "") {
		return false;
	}
	if (value instanceof Date) {
		return !Number.isNaN(value.getTime());
	}
	if (typeof value === "object" && Object.keys(value).length === 0) {
		return false;
	}
	return true;
}

export function formatFieldValue(
	value: unknown,
	{ valueType, enumKey, tEnum, tCommon }: FormatOptions,
): string | number {
	switch (valueType) {
		case "enum":
			if (enumKey && typeof value === "string") {
				return tEnum ? tEnum(`${enumKey}.${value}`) : value;
			}
			return String(value);
		case "nested":
			if (value && typeof value === "object" && "name" in value) {
				return String((value as { name: string }).name);
			}
			return String(value);
		case "year":
			if (typeof value === "number") {
				return value;
			}
			if (typeof value === "string" || value instanceof Date) {
				const parsed = new Date(value);
				return Number.isNaN(parsed.getTime())
					? String(value)
					: parsed.getFullYear();
			}
			return String(value);
		case "date":
			if (typeof value === "string" || value instanceof Date) {
				const parsed = new Date(value);
				return Number.isNaN(parsed.getTime())
					? String(value)
					: parsed.toLocaleDateString();
			}
			return String(value);
		case "boolean":
			if (typeof value === "boolean") {
				if (tCommon) {
					return value ? tCommon("yes") : tCommon("no");
				}
				return value ? "Yes" : "No";
			}
			return String(value);
		case "text":
		default:
			return String(value);
	}
}
