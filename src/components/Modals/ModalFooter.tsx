"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { getModalLink } from "@/lib/utils/modalRouting";
import KRBLogo from "@/logos/KRB.svg";
import KukaLargeLogo from "@/logos/kuka-large.svg";
import KukaSmallLogo from "@/logos/kuka-small.svg";
import SenateLogo from "@/logos/senate.svg";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface ModalFooterProps {
	hideLinks?: string[];
}

const footerItems = [
	{ id: "about" },
	{ id: "imprint" },
	{ id: "privacy" },
	{ id: "terms" },
	{ id: "accessibility" },
	{ id: "simpleLanguageInformation" },
	{ id: "signLanguageInformationShort" },
] as const;

export function ModalFooter({ hideLinks }: ModalFooterProps) {
	const { t } = useTranslation("common");
	const isMobile = useIsMobile();

	return (
		<>
			<div className="ModalFooter-root flex justify-center w-full h-auto bg-secondary p-4 md:p-6 py-12 md:mt-12">
				<div className="w-full flex flex-col md:flex-row md:items-center md:justify-between">
					<div className="w-4/11 hidden md:flex items-center justify-center">
						<KukaLargeLogo
							title="Kulturkataster Berlin, Logo"
							className="h-auto w-36"
						/>
					</div>
					<div className="block mb-8 md:hidden">
						<KukaSmallLogo
							title="Kulturkataster Berlin, Logo"
							className="h-auto w-16"
						/>
					</div>
					<div className="w-full md:w-7/11 flex justify-center flex-col text-left">
						<h2>{t("footer.title")}</h2>
						<div className="body2 flex flex-col">
							<span>{t("footer.address.suffix")}</span>
							<span>{t("footer.address.street")}</span>
							<div className="flex space-x-2">
								<span>{t("footer.address.zip")}</span>
								<span>{t("footer.address.city")}</span>
							</div>
							<div className="flex space-x-2">
								<span>{t("telephone.labelShort")}</span>
								<a className="underline" href={`tel:${t("telephone.number")}`}>
									{t("telephone.number")}
								</a>
							</div>
							<div className="flex gap-2">
								<span>{t("email.label")}</span>
								<a className="underline" href={`mailto:${t("email.address")}`}>
									{t("email.address")}
								</a>
							</div>
							<div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-16 font-bold flex-wrap">
								{footerItems
									.filter((footerItem) => !hideLinks?.includes(footerItem.id))
									.map((item) => (
										<Link
											key={item.id}
											className="body2 font-bold select-none"
											href={getModalLink(item.id).url}
											target={getModalLink(item.id).target}
											rel="noopener noreferrer"
										>
											{item.id === "signLanguageInformationShort" && isMobile
												? t(`footer.signLanguageInformation`)
												: t(`footer.${item.id}`)}
										</Link>
									))}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="w-full bg-background flex justify-center">
				<div className="p-6 mt-4 pb-10 flex-col md:flex md:flex-row md:max-w-5xl space-x-2 md:mb-12 space-y-12 md:space-y-0 items-center">
					<div className="w-full md:w-1/2">
						<p className="body2 ">
							{t("footer.credit.text", { ns: "common" })}
						</p>
					</div>
					<div className="flex md:w-1/2 md:justify-end justify-around gap-2 space-x-4">
						<KRBLogo
							title="Kulturraum Berlin gGmbH, Logo"
							className="w-20 md:w-24 h-auto bg-background"
						/>
						<SenateLogo
							title="Logo der Senatsverwaltung für Kultur und Gesellschaftlichen Zusammenhalt, Logo"
							className="w-32 md:w-42 h-auto bg-background"
						/>
					</div>
				</div>
			</div>
		</>
	);
}
