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
	| "category"
	| "address"
	| "link"
	| "section";

interface InfoWrapperBaseFieldConfig {
	id?: string;
	infoId?: string;
	value?: string | ((data: Institution) => unknown);
	label?: string;
	labelKey?: string;
	enumKey?: string;
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
	edit?: {
		enabled?: boolean;
		label?: string;
		href?: string;
		onClick?: (data: Institution) => void;
	};
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
	edit?: {
		enabled?: boolean;
		onClick?: (data: Institution) => void;
		ariaLabel?: string;
	};
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
}

export type Status =
	| "in_use"
	| "temporarily_closed"
	| "planned_use"
	| "permanently_closed"
	| "unknown"
	| "potential_space"
	| "long_term_secured"
	| "medium_term_secured"
	| "uncertain"
	| "acutely_threatened"
	| "not_yet_secured";

// Maps status values to their level (0 = best/safest, higher = worse)
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

// Determine if a status is positive (level 0 = good) or negative (level 1+ = warning/bad)
export function getStatusLevel(value: string): "positive" | "negative" {
	const level = StatusLevelMap[value];
	return level === 0 ? "positive" : "negative";
}

export type { InfoWrapperFieldType as FieldValueType };
