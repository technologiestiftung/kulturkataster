import i18next from "i18next";
import Backend from "i18next-fs-backend";
import path from "path";
import { i18nConfig } from "./config";

const i18nInit = async (
	lng: string = "de",
	ns: string | string[] = i18nConfig.namespaces,
) => {
	const i18nInstance = i18next.createInstance();

	await i18nInstance.use(Backend).init({
		lng,
		fallbackLng: i18nConfig.fallbackLng,
		ns,
		defaultNS: i18nConfig.defaultNS,
		backend: {
			loadPath: path.resolve(i18nConfig.serverLoadPath),
		},
		interpolation: i18nConfig.interpolation,
	});

	return i18nInstance;
};

export default i18nInit;
