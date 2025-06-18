export const Config = {
	alerting: {},
	namedProjections: [
		[
			"EPSG:25833",
			"+title=ETRS89/UTM 33N +proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
		],
	],
	layerConf: "./resources/services.json",
	restConf: "./resources/rest-services-internet.json",
	styleConf: "./resources/style.json",
	wfsImgPath: "./resources/img/",
	portalLanguage: {
		enabled: true,
		debug: false,
		languages: {
			de: "Deutsch",
			en: "English",
		},
		fallbackLanguage: "de",
		changeLanguageOnStartWhen: ["querystring", "localStorage", "htmlTag"],
	},
};
