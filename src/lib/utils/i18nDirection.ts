import type { Locale } from "@/types";

const RTL_LOCALES = new Set(["ar", "fa", "he", "ur"]);

export function getDirection(locale: Locale): "ltr" | "rtl" {
	return RTL_LOCALES.has(locale.toLowerCase()) ? "rtl" : "ltr";
}
