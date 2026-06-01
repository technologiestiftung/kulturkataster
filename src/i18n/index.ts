import { createInstance, TFunction, i18n, Resource } from "i18next";
import { initReactI18next } from "react-i18next/initReactI18next";
import resourcesToBackend from "i18next-resources-to-backend";
import merge from "lodash/merge";
import { Locale } from "../types/i18n";
import { fetchTranslations } from "@/server/actions/fetchTranslations";
import { allowedLocales, defaultLocale, i18nConfig } from "./config";

export { i18nConfig };
export { allowedLocales, defaultLocale };

type TranslationBundle = Record<string, unknown>;
const TRANSLATION_NAMESPACE = "translation";
const DEFAULT_REMOTE_TRANSLATION_CACHE_TTL_MS = 60_000;

type RemoteTranslationCacheEntry = {
	expiresAt: number;
	promise: Promise<TranslationBundle>;
};

const remoteTranslationsByLanguage = new Map<
	string,
	RemoteTranslationCacheEntry
>();

function getRemoteTranslationCacheTtlMs() {
	const rawValue = process.env.TRADUORA_TRANSLATION_CACHE_TTL_MS;
	if (!rawValue) return DEFAULT_REMOTE_TRANSLATION_CACHE_TTL_MS;

	const parsedValue = Number(rawValue);
	return Number.isFinite(parsedValue) && parsedValue >= 0
		? parsedValue
		: DEFAULT_REMOTE_TRANSLATION_CACHE_TTL_MS;
}

function isTranslationBundle(value: unknown): value is TranslationBundle {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fetchRemoteLanguageTranslations(language: string) {
	const ttlMs = getRemoteTranslationCacheTtlMs();
	const now = Date.now();
	const cached = remoteTranslationsByLanguage.get(language);
	if (cached && cached.expiresAt > now) return cached.promise;

	const translations = fetchTranslations(language).catch((error) => {
		remoteTranslationsByLanguage.delete(language);
		throw error;
	});
	if (ttlMs > 0) {
		remoteTranslationsByLanguage.set(language, {
			expiresAt: now + ttlMs,
			promise: translations,
		});
	}
	return translations;
}

async function initTranslations(
	locale: string,
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
			if (namespace !== TRANSLATION_NAMESPACE) return {};

			try {
				// First try to get local translations as fallback
				const localTranslations = await import(
					`@/lib/i18n/translations/${language}/translation.json`
				);
				const localTranslationsBundle = localTranslations.default ?? {};

				try {
					const remoteTranslations =
						await fetchRemoteLanguageTranslations(language);
					const merged = merge({}, localTranslationsBundle, remoteTranslations);
					return merged;
				} catch {
					return localTranslationsBundle;
				}
			} catch {
				const translations = await fetchRemoteLanguageTranslations(language);
				return isTranslationBundle(translations) ? translations : {};
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
		defaultNS: TRANSLATION_NAMESPACE,
		fallbackNS: TRANSLATION_NAMESPACE,
		ns: [TRANSLATION_NAMESPACE],
		preload: options?.resources ? [] : [locale],
	});

	return {
		i18n: i18nInstance,
		resources: i18nInstance.services.resourceStore.data,
		t: i18nInstance.getFixedT(
			locale,
			TRANSLATION_NAMESPACE,
			options?.keyPrefix,
		) as TFunction<Locale, undefined>,
	};
}

// Exported function to fetch translations on server components
export async function serverSideTranslation(
	locale: string,
	options?: {
		keyPrefix?: string;
		i18nInstance?: i18n;
		resources?: Record<string, unknown>;
	},
) {
	return await initTranslations(locale, options);
}
