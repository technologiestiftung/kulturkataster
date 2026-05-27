"use client";

import { I18nextProvider } from "react-i18next";
import { createInstance } from "i18next";
import { serverSideTranslation } from ".";

type Props = {
	children: React.ReactNode;
	locale: string;
	resources: Record<string, unknown>;
};

export default function I18NProvider({ children, locale, resources }: Props) {
	const i18n = createInstance();

	// Initialize client-side i18n instance with resources provided by the server
	serverSideTranslation(locale, { i18nInstance: i18n, resources });

	return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
