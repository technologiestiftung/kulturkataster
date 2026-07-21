export type ModalLinkTarget = "_blank" | "_self";

type ModalLink = {
	url: string;
	target: ModalLinkTarget;
};

type PathLocalizer = (path: string) => string;
type ModalLinkOptions = {
	isMobile?: boolean;
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

const getPrivacyUrl = (localizePath?: PathLocalizer) => {
	const localizedRoot = localizePath?.("/") ?? "";
	return localizedRoot.startsWith("/en")
		? "https://dsgvo-info.cortina-consult.de/kulturkataster-en/"
		: "https://dsgvo-info.cortina-consult.de/kulturkataster/";
};

export const getModalLink = (
	id: string,
	localizePath?: PathLocalizer,
	options?: ModalLinkOptions,
): ModalLink => {
	if (!id) {
		return {
			url: localizePath ? localizePath("/") : "/",
			target: "_self",
		};
	}

	const resolvedId =
		options?.isMobile && id === "accessibilitySettings" ? "mobileMenu" : id;
	if (resolvedId === "privacy") {
		return {
			url: getPrivacyUrl(localizePath),
			target: "_blank",
		};
	}

	const link = MODAL_ROUTE_MAP[resolvedId] ?? {
		url: `/${resolvedId}`,
		target: "_self",
	};

	if (link.target === "_self" && localizePath) {
		return {
			...link,
			url: localizePath(link.url),
		};
	}

	return link;
};
