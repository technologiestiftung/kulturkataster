import { defaultLocale } from "@/i18n/config";

export const formatDateWithLocale = (
	value: Date | string | null | undefined,
	options?: {
		locale?: string;
		format?: Intl.DateTimeFormatOptions;
		fallback?: string;
	},
) => {
	const locale = options?.locale ?? defaultLocale;
	const fallback = options?.fallback ?? "-";
	if (!value) return fallback;
	const parsed = value instanceof Date ? value : new Date(value);
	if (!Number.isFinite(parsed.getTime())) return fallback;
	return new Intl.DateTimeFormat(locale, options?.format).format(parsed);
};
