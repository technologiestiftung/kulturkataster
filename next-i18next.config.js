/* eslint-disable @typescript-eslint/no-require-imports */
const { i18nConfig } = require("./src/i18n/config");

module.exports = {
	i18n: {
		defaultLocale: i18nConfig.defaultLocale,
		locales: i18nConfig.supportedLngs,
	},
};
