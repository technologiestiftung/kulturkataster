import type { ReactNode } from "react";
import type { Category } from "@/types";

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
	| "multiselect"
	| "addressMap"
	| "filterPanel"
	| "actionPanel"
	| "tablePermissions"
	| "fieldPermissions";

export type PermissionAction = "read" | "create" | "update" | "delete";

export interface SelectOption {
	label: string;
	value: string;
	searchText?: string;
	filterValues?: Record<string, string[]>;
	parentValue?: string;
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
	multiselectVariant?: "list" | "modal";
	searchPlaceholder?: string;
	emptyText?: string;
	previewCount?: number;
	multiselectFilterPanel?: ReactNode;
	multiselectFilteredOptions?: SelectOption[];
	multiselectFilters?: {
		id: string;
		label: string;
		dependsOn?: string;
		options: SelectOption[];
	}[];
	multiselectSortOptions?: {
		id: string;
		label: string;
		compare?: (a: SelectOption, b: SelectOption) => number;
	}[];
	tablePermissions?: {
		tables: { key: string; label: string }[];
		actions?: PermissionAction[];
		actionLabels?: Partial<Record<PermissionAction, string>>;
	};
	fieldPermissions?: {
		sections: {
			id: string;
			title: string;
			fields: { key: string; label: string }[];
		}[];
		actions?: PermissionAction[];
		actionLabels?: Partial<Record<PermissionAction, string>>;
		fieldLabel?: string;
	};
	actionPanel?: {
		title: string;
		description: string;
		actionLabel: string;
		actionLabelLoading: string;
		onAction: () => Promise<string | null | undefined>;
		errorFallback: string;
		className?: string;
		icon?: ReactNode;
	};
	filterPanel?: {
		categoryGroups: Category[];
		districts: string[];
		filteredCount?: number;
		categoryCounts?: Record<string, number>;
		subcategoryCounts?: Record<string, number>;
		loading?: boolean;
		error?: string | null;
		onRetry?: () => void;
		showSummary?: boolean;
		showDistricts?: boolean;
		showClosedToggle?: boolean;
		collapsible?: boolean;
		defaultCollapsed?: boolean;
		categorySectionMode?: "filter" | "selection";
		selectionEmptyLabel?: string;
	};
	addressMap?: {
		latField: string;
		lngField: string;
		streetField?: string;
		streetNumberField?: string;
		cityField?: string;
		zipField?: string;
		initialZoom?: number;
	};

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
	onBlur?: (
		value: unknown,
		formData: Record<string, unknown>,
		updateField: (name: string, value: unknown) => void,
	) => void | Promise<void>;

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
