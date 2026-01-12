export type FieldType =
	| "text"
	| "email"
	| "password"
	| "number"
	| "tel"
	| "url"
	| "date"
	| "textarea"
	| "select"
	| "radio"
	| "checkbox"
	| "switch"
	| "multiselect";

export interface SelectOption {
	label: string;
	value: string;
}

export interface FieldConfig {
	name: string;
	label: string;
	type: FieldType;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	description?: string;
	defaultValue?: unknown;

	// For select, radio, checkbox, multiselect
	options?: SelectOption[];

	// For number inputs
	min?: number;
	max?: number;
	step?: number;

	// Grid layout
	gridColumn?: "full" | "half"; // full width or half width in grid

	// Custom validation
	validate?: (value: unknown) => string | undefined;

	// Conditional rendering
	condition?: (formData: Record<string, unknown>) => boolean;
}

export interface AccordionSection {
	id: string;
	title: string;
	description?: string;
	defaultOpen?: boolean;
	useAccordion?: boolean; // Whether this section should be rendered as accordion
	fields: FieldConfig[];
}

export interface FormWrapperConfig {
	// Either flat fields or accordion sections
	fields?: FieldConfig[];
	sections?: AccordionSection[];

	// Form-level settings
	onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
	submitLabel?: string;
	showCancel?: boolean;
	cancelLabel?: string;
	onCancel?: () => void;

	// Initial values
	initialValues?: Record<string, unknown>;

	// Layout
	gridColumns?: 1 | 2; // Number of columns for field layout

	// Hide built-in form actions (useful when used inside Dialog or with custom actions)
	hideActions?: boolean;
}
