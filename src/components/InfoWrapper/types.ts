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

export type Status = "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6";

export const StatusMap: Record<string, Status> = {
	in_use: "L0",
	temporarily_closed: "L2",
	planned_use: "L4",
	permanently_closed: "L5",
	unknown: "L6",
	potential_space: "L1",
	long_term_secured: "L0",
	medium_term_secured: "L3",
	uncertain: "L2",
	acutely_threatened: "L4",
	not_yet_secured: "L6",
};

export type { InfoWrapperFieldType as FieldValueType };
