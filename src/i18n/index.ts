import { createInstance, TFunction, i18n, Resource } from "i18next";
import { initReactI18next } from "react-i18next/initReactI18next";
import resourcesToBackend from "i18next-resources-to-backend";
import merge from "lodash/merge";
import { Locale } from "../types/i18n";
import { fetchTranslations } from "@/server/actions/fetchTranslations";
import { allowedLocales, defaultLocale, i18nConfig } from "./config";

export { i18nConfig };
export { allowedLocales, defaultLocale };

async function initTranslations(
	locale: string,
	namespaces: string[],
	options?: {
		keyPrefix?: string;
		i18nInstance?: i18n;
		resources?: Record<string, unknown>;
	},
) {
	const i18nInstance = options?.i18nInstance || createInstance();

	i18nInstance.use(initReactI18next);

	const translationLoader = resourcesToBackend(
		async (language: string, namespace: string) => {
			try {
				// First try to get local translations as fallback
				const localTranslations = await import(
					`@/lib/i18n/translations/${language}/${namespace}.json`
				);

				try {
					const traduoraTranslations = await fetchTranslations(
						language,
						namespace,
					);
					const merged = merge(
						{},
						localTranslations.default,
						traduoraTranslations,
					);
					return merged;
				} catch {
					return localTranslations.default;
				}
			} catch {
				const translations = await fetchTranslations(language, namespace);
				return translations;
			}
		},
	);

	if (!options?.resources) {
		i18nInstance.use(translationLoader);
	}

	await i18nInstance.init({
		lng: locale,
		resources: options?.resources as Resource | undefined,
		fallbackLng: i18nConfig.defaultLocale,
		supportedLngs: i18nConfig.locales,
		defaultNS: namespaces[0],
		fallbackNS: namespaces[0],
		ns: namespaces,
		preload: options?.resources ? [] : [locale],
	});

	return {
		i18n: i18nInstance,
		resources: i18nInstance.services.resourceStore.data,
		t: i18nInstance.getFixedT(
			locale,
			namespaces[0],
			options?.keyPrefix,
		) as TFunction<Locale, undefined>,
	};
}

// Exported function to fetch translations on server components
export async function serverSideTranslation(
	locale: string,
	namespaces: string[],
	options?: {
		keyPrefix?: string;
		i18nInstance?: i18n;
		resources?: Record<string, unknown>;
	},
) {
	return await initTranslations(locale, namespaces, options);
}
