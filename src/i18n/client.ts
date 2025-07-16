import i18n from "i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { i18nConfig } from "./config";

i18n
	.use(HttpBackend)
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		fallbackLng: i18nConfig.fallbackLng,
		supportedLngs: i18nConfig.supportedLngs,
		ns: i18nConfig.namespaces,
		defaultNS: i18nConfig.defaultNS,
		backend: {
			loadPath: i18nConfig.loadPath,
		},
		interpolation: i18nConfig.interpolation,
	});

export default i18n;
