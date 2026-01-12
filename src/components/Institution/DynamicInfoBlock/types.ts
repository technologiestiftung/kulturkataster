import type { Institution } from "@/types";

export type FieldValueType =
	| "text"
	| "enum"
	| "nested"
	| "date"
	| "year"
	| "boolean";

export interface InfoFieldConfig {
	// The key to access the value from the institution data (e.g., "closing_reason", "owner.owner_type")
	dataPath: string;
	// Translation key for the label (e.g., "institution.closingReason")
	labelKey: string;
	// How to display the value
	valueType?: FieldValueType;
	// For enum type: the prefix for the enum translation key (e.g., "owner_type")
	enumKey?: string;
	// Custom render function
	render?: (value: unknown, data: Institution) => React.ReactNode;
	// Condition to show this field
	condition?: (data: Institution) => boolean;
}

export interface DynamicInfoBlockConfig {
	// Fields to display
	fields: InfoFieldConfig[];
	// Whether to always show the section even if all fields are empty
	alwaysShow?: boolean;
}
