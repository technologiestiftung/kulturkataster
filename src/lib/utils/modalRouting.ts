export type ModalLinkTarget = "_blank" | "_self";

type ModalLink = {
	url: string;
	target: ModalLinkTarget;
};

const MODAL_ROUTE_MAP: Record<string, ModalLink> = {
	simpleLanguage: { url: "/simpleLanguage", target: "_self" },
	signLanguage: { url: "/signLanguage", target: "_self" },
	information: { url: "/info", target: "_self" },
	download: { url: "/downloadModal", target: "_self" },
	privacy: {
		url: "https://dsgvo-info.cortina-consult.de/kulturkataster/",
		target: "_blank",
	},
};

export const getModalLink = (id: string): ModalLink => {
	if (!id) {
		return { url: "/", target: "_self" };
	}

	return MODAL_ROUTE_MAP[id] ?? { url: `/${id}`, target: "_self" };
};
