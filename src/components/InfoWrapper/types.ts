import type { Institution } from "@/types";
import type { ReactNode } from "react";

export interface Layout {
	columns?: 1 | 2;
	span?: "full" | "half";
	spanClass?: string;
}

export type InfoWrapperFieldType =
	| "title"
	| "email"
	| "phone"
	| "text"
	| "enum"
	| "nested"
	| "date"
	| "year"
	| "boolean"
	| "status"
	| "url"
	| "category"
	| "fundingSources"
	| "address"
	| "link"
	| "section";

export interface InfoWrapperEditConfig {
	enabled?: boolean;
	label?: string;
	ariaLabel?: string;
	href?: string;
	onClick?: (data: Institution) => void;
}

interface InfoWrapperBaseFieldConfig {
	id?: string;
	infoId?: string;
	value?: string | ((data: Institution) => unknown);
	permissionField?: string;
	isPrivate?: boolean;
	label?: string;
	labelKey?: string;
	enumKey?: string;
	freeTextKey?: string;
	freeTextValue?: string | number | boolean;
	render?: (value: unknown, data: Institution) => ReactNode;
	condition?: (data: Institution) => boolean;
	description?: string;
	className?: string;
	alwaysShow?: boolean;
	href?: string | ((data: Institution) => string);
	layout?: Layout;
	addressOptions?: {
		showMapLink?: boolean;
		showCopy?: boolean;
		mapLabel?: string;
		copyLabel?: string;
		copiedLabel?: string;
		mapHref?: string | ((data: Institution) => string);
	};
	categoryVariant?: "default" | "compact";
	statusVariant?: "default" | "plain";
	onClick?: (data: Institution) => void;
	onClickAriaLabel?: string;
	edit?: InfoWrapperEditConfig;
}

type InfoWrapperSectionFieldConfig = InfoWrapperBaseFieldConfig & {
	type: "section";
	title?: ReactNode;
	description?: string;
	fields: InfoWrapperFieldConfig[];
	cardVariant?: "default" | "secondary" | "tertiary" | "none" | "hero";
	accordionVariant?: "default" | "secondary";
	heroStatus?: "in_use" | "not_in_use" | "unknown";
	onClick?: (data: Institution) => void;
	onClickAriaLabel?: string;
	edit?: InfoWrapperEditConfig;
	collapsible?: boolean;
	defaultOpen?: boolean;
	layout?: Layout;
	className?: string;
	infoId?: string;
};

type InfoWrapperNonSectionFieldConfig = InfoWrapperBaseFieldConfig & {
	type: Exclude<InfoWrapperFieldType, "section">;
	fields?: never;
};

export type InfoWrapperFieldConfig =
	| InfoWrapperSectionFieldConfig
	| InfoWrapperNonSectionFieldConfig;

export interface InfoWrapperConfig {
	fields: InfoWrapperFieldConfig[];
	infoId?: string;
	className?: string;
	cardVariant?: "default" | "secondary" | "tertiary" | "none" | "hero";
	accordionVariant?: "default" | "secondary";
	alwaysShow?: boolean;
	useAccordion?: boolean;
	defaultOpen?: boolean;
	layout?: Layout;
	showPrivateBadge?: boolean;
	isPrivateField?: (field: InfoWrapperFieldConfig) => boolean;
}

export const StatusLevelMap: Record<string, number> = {
	in_use: 0,
	potential_space: 1,
	temporarily_closed: 2,
	uncertain: 2,
	medium_term_secured: 3,
	planned_use: 4,
	acutely_threatened: 4,
	permanently_closed: 5,
	not_yet_secured: 6,
	unknown: 6,
	long_term_secured: 0,
};

export type { InfoWrapperFieldType as FieldValueType };
