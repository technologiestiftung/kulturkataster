export const i18nConfig = {
	defaultLocale: "de",
	fallbackLng: "de",
	supportedLngs: ["en", "de"],
	namespaces: ["common"],
	defaultNS: "common",
	localePath: "./public/locales",
	loadPath: "/locales/{{lng}}/{{ns}}.json",
	serverLoadPath: "./public/locales/{{lng}}/{{ns}}.json",
	interpolation: {
		escapeValue: false,
	},
};

export type SupportedLanguage = (typeof i18nConfig.supportedLngs)[number];
export type Namespace = (typeof i18nConfig.namespaces)[number];
