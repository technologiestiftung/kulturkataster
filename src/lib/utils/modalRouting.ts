export type ModalLinkTarget = "_blank" | "_self";

type ModalLink = {
	url: string;
	target: ModalLinkTarget;
};

const MODAL_ROUTE_MAP: Record<string, ModalLink> = {
	about: { url: "/about", target: "_self" },
	accessibility: { url: "/accessibility", target: "_self" },
	accessibilitySettings: { url: "/accessibilitySettings", target: "_self" },
	imprint: { url: "/imprint", target: "_self" },
	info: { url: "/info", target: "_self" },
	mobileMenu: { url: "/mobileMenu", target: "_self" },
	download: { url: "/download", target: "_self" },
	simpleLanguage: { url: "/simpleLanguage", target: "_self" },
	simpleLanguageInformation: { url: "/simpleLanguage", target: "_self" },
	signLanguage: { url: "/signLanguage", target: "_self" },
	signLanguageInformationShort: { url: "/signLanguage", target: "_self" },
	signLanguageInformationLong: { url: "/signLanguage", target: "_self" },
	information: { url: "/info", target: "_self" },
	welcome: { url: "/welcome", target: "_self" },
	privacy: {
		url: "https://dsgvo-info.cortina-consult.de/kulturkataster/",
		target: "_blank",
	},
	terms: { url: "/terms", target: "_self" },
};

export const getModalLink = (id: string): ModalLink => {
	if (!id) {
		return { url: "/", target: "_self" };
	}

	return MODAL_ROUTE_MAP[id] ?? { url: `/${id}`, target: "_self" };
};
