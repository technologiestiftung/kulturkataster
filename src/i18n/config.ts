import type { AllowedLocales, I18NConfig } from "@/types";

export const defaultLocale = "de";

export const allowedLocales: AllowedLocales = [defaultLocale, "de"];

export const i18nConfig: I18NConfig = {
	locales: allowedLocales,
	defaultLocale,
	prefixDefault: false, // avoids prefixing the default locale in URLs
};
