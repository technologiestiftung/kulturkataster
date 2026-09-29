import type { ReactNode } from "react";
import type { Category } from "@/types";

export interface Layout {
	columns?: 1 | 2;
	span?: "full" | "half";
	spanClass?: string;
}

export type FieldType =
	| "text"
	| "email"
	| "password"
	| "number"
	| "tel"
	| "url"
	| "date"
	| "file"
	| "textarea"
	| "select"
	| "radio"
	| "checkbox"
	| "switch"
	| "multiselect"
	| "addressMap"
	| "filterPanel"
	| "actionPanel"
	| "custom"
	| "tablePermissions"
	| "fieldPermissions"
	| "fundingSources"
	| "keyValue"
	| "section";

export type PermissionAction =
	| "read"
	| "create"
	| "update"
	| "delete"
	| "download";
export type PermissionScope = "own" | "all";

// Lets users add an entry that is not in the list yet; the parent adds the returned value to `options`.
export type MultiSelectCreateOption = {
	getLabel: (term: string) => string;
	onCreate: (term: string) => string;
};

export type TablePermissionValue = {
	actions: PermissionAction[];
	scope: PermissionScope;
};
export interface SelectOption {
	label: string | ReactNode;
	value: string | number | boolean;
	description?: string | ReactNode;
	searchText?: string;
	filterValues?: Record<string, string[]>;
	parentValue?: string | number | boolean;
}

export type FieldNormalizer = (
	value: unknown,
	formData: Record<string, unknown>,
) => unknown;

export type FieldValidator = ((
	value: unknown,
	formData: Record<string, unknown>,
) => string | undefined) & {
	normalize?: FieldNormalizer;
};

type FormWrapperSectionConfig = {
	title?: string;
	description?: string;
	fields: FormWrapperFieldConfig[];
	cardVariant?: "default" | "secondary" | "tertiary" | "none";
	collapsible?: boolean;
	defaultOpen?: boolean;
	accordionVariant?: "default" | "secondary";
	accordionTitle?: ReactNode;
	accordionDescription?: string;
	privateDescription?: string;
	className?: string;
	layout?: Layout;
	fieldGap?: "gap-0" | "gap-2" | "gap-4" | "gap-6";
};

type FormWrapperSectionFieldConfig = {
	name: string;
	type: "section";
	label?: string | null;
	labelNode?: ReactNode;
	required?: boolean;
	requiredMessage?: string;
	hideRequiredIndicator?: boolean;
	disabled?: boolean;
	afterField?: ReactNode;
	defaultValue?: unknown;
	validators?: FieldValidator[];
	onBlur?: (
		value: unknown,
		formData: Record<string, unknown>,
		updateField: (name: string, value: unknown) => void,
	) => void | Promise<void>;
	section?: FormWrapperSectionConfig;
	fields?: FormWrapperFieldConfig[];
	title?: string;
	description?: string;
	privateDescription?: string;
	cardVariant?: "default" | "secondary" | "tertiary" | "none";
	collapsible?: boolean;
	defaultOpen?: boolean;
	accordionVariant?: "default" | "secondary";
	accordionTitle?: ReactNode;
	accordionDescription?: string;
	className?: string;
	layout?: Layout;
	fieldGap?: "gap-0" | "gap-2" | "gap-4" | "gap-6";
	condition?: (formData: Record<string, unknown>) => boolean;
};

type FormWrapperNonSectionFieldConfig = {
	name: string;
	fieldMetaKey?: string;
	label?: string | null;
	labelNode?: ReactNode;
	type: Exclude<FieldType, "section">;
	fields?: never;
	collapsible?: boolean;
	defaultOpen?: boolean;
	accordionVariant?: "default" | "secondary";
	accordionTitle?: ReactNode;
	accordionDescription?: string;
	placeholder?: string;
	required?: boolean;
	requiredMessage?: string;
	hideRequiredIndicator?: boolean;
	errorMessages?: Partial<Record<string, string>>;
	disabled?: boolean;
	description?: string;
	privateDescription?: string;
	defaultValue?: unknown;
	radioVariant?: "default" | "button";
	multiselectVariant?: "list" | "modal";
	searchPlaceholder?: string;
	emptyText?: string;
	previewCount?: number;
	allowNullOption?: boolean;
	nullOptionLabel?: string | ReactNode;
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
	multiselectCreateOption?: MultiSelectCreateOption;
	tablePermissions?: {
		tables: {
			key: string;
			label: string;
			actions?: PermissionAction[];
		}[];
		actions?: PermissionAction[];
		actionLabels?: Partial<Record<PermissionAction, string>>;
		scopeOptions?: { value: PermissionScope; label: string }[];
		scopeLabel?: string;
		scopeDescription?: string;
	};
	fieldPermissions?: {
		sections: {
			id: string;
			title: string;
			fields: {
				key: string;
				label: string;
				relationLabel?: string;
				relationShortLabel?: string;
				isRelationField?: boolean;
			}[];
		}[];
		actions?: PermissionAction[];
		actionLabels?: Partial<Record<PermissionAction, string>>;
		fieldLabel?: string;
		reorderable?: boolean;
		reorderLabel?: string;
		onReorderFields?: (
			sectionId: string,
			fields: {
				key: string;
				label: string;
				relationLabel?: string;
				relationShortLabel?: string;
				isRelationField?: boolean;
			}[],
		) => void;
	};
	actionPanel?: {
		title: string;
		description: string;
		actionLabel: string;
		actionLabelLoading: string;
		onAction: () => Promise<string | null | undefined>;
		secondaryActionLabel?: string;
		secondaryActionLabelLoading?: string;
		onSecondaryAction?: () => Promise<string | null | undefined>;
		errorFallback: string;
		secondaryErrorFallback?: string;
		className?: string;
		icon?: ReactNode;
	};
	customField?: ReactNode;
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
		parentCategorySelectionBehavior?:
			| "select-all-children"
			| "parent-only"
			| "last-child-only";
		selectionEmptyLabel?: string;
	};
	addressMap?: {
		latField: string;
		lngField: string;
		streetField?: string;
		streetNumberField?: string;
		cityField?: string;
		zipField?: string;
		districtField?: string;
		neighbourhoodField?: string;
		initialZoom?: number;
	};
	fundingSources?: {
		sourceLabel?: string;
		descriptionLabel?: string;
		sourcePlaceholder?: string;
		descriptionPlaceholder?: string;
		addButtonLabel?: string;
		removeButtonLabel?: string;
		maxItems?: number;
	};
	keyValue?: {
		keyPlaceholder?: string;
		valuePlaceholder?: string;
		addButtonLabel?: string;
		removeButtonLabel?: string;
		allowAdd?: boolean;
		keyReadOnly?: boolean;
		keyLabels?: Record<string, string>;
	};

	// For select, radio, checkbox, multiselect
	options?: SelectOption[];

	// For number inputs
	min?: number;
	max?: number;
	step?: number;
	accept?: string;
	multiple?: boolean;
	fileRemoveOption?: {
		fieldName: string;
		label: string;
	};

	// Grid layout
	layout?: Layout;
	className?: string;

	// Custom validation
	validators?: FieldValidator[];
	onBlur?: (
		value: unknown,
		formData: Record<string, unknown>,
		updateField: (name: string, value: unknown) => void,
	) => void | Promise<void>;
	afterField?: ReactNode;

	// Conditional rendering
	condition?: (formData: Record<string, unknown>) => boolean;
};

export type FormWrapperFieldConfig =
	| FormWrapperSectionFieldConfig
	| FormWrapperNonSectionFieldConfig;

export interface FormWrapperConfig {
	// Fields can be regular fields or section fields with nested fields
	fields: FormWrapperFieldConfig[];
	// Optional fields rendered after the action buttons
	footerFields?: FormWrapperFieldConfig[];
	formId?: string;
	className?: string;

	// Form-level settings
	onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
	onChange?: (data: Record<string, unknown>) => void;
	submitLabel?: string;
	submitDisabled?: boolean;
	showCancel?: boolean;
	cancelLabel?: string;
	onCancel?: () => void;
	deleteAction?: {
		label: string;
		onClick: () => void;
		disabled?: boolean;
		className?: string;
	};

	// Initial values
	initialValues?: Record<string, unknown>;

	// Layout
	layout?: Layout;
	cardVariant?: "default" | "secondary" | "none";
	isPrivateField?: (field: FormWrapperFieldConfig) => boolean;

	// Hide built-in form actions (useful when used inside Dialog or with custom actions)
	hideActions?: boolean;
}
