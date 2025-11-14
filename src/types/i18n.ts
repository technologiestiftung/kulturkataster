export type Locale = string;

export type AllowedLocales = Locale[];

export type I18NConfig = {
	locales: string[];
	defaultLocale: string;
	prefixDefault: boolean;
};
