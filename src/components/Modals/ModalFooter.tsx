"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { getModalLink } from "@/lib/utils/modalRouting";
import KRBLogo from "@/logos/KRB.svg";
import KukaLargeLogo from "@/logos/kuka-large.svg";
import KukaSmallLogo from "@/logos/kuka-small.svg";
import SenateLogo from "@/logos/senate.svg";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

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
	const { t } = useTranslation();
	const isMobile = useIsMobile();
	const toLocalePath = useLocalePath();

	return (
		<>
			<div
				className={cn(
					"ModalFooter-root flex justify-center p-8 h-auto bg-secondary py-12 md:mt-12",
					"-mx-4 w-[calc(100%+2rem)]",
				)}
			>
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
						<h2>{t("common.footer.title")}</h2>
						<div className="body2 flex flex-col">
							<span>{t("common.footer.address.suffix")}</span>
							<span>{t("common.footer.address.street")}</span>
							<div className="flex space-x-2">
								<span>{t("common.footer.address.zip")}</span>
								<span>{t("common.footer.address.city")}</span>
							</div>
							<div className="flex space-x-2">
								<span>{t("common.telephone.labelShort")}</span>
								<a
									className="underline"
									href={`tel:${t("common.telephone.number")}`}
								>
									{t("common.telephone.number")}
								</a>
							</div>
							<div className="flex gap-2">
								<span>{t("common.email.label")}</span>
								<a
									className="underline"
									href={`mailto:${t("common.email.address")}`}
								>
									{t("common.email.address")}
								</a>
							</div>
							<div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-16 font-bold flex-wrap">
								{footerItems
									.filter((footerItem) => !hideLinks?.includes(footerItem.id))
									.map((item) => {
										const link = getModalLink(item.id, toLocalePath);
										return (
											<Link
												key={item.id}
												className="body2 font-bold select-none"
												href={link.url}
												target={link.target}
												rel="noopener noreferrer"
											>
												{item.id === "signLanguageInformationShort" && isMobile
													? t(`common.footer.signLanguageInformationLong`)
													: t(`common.footer.${item.id}`)}
											</Link>
										);
									})}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div
				className={cn(
					"w-[calc(100%+2rem)] bg-background flex justify-center max-w-full",
					"-mx-4 md:mx-0",
				)}
			>
				<div className="p-6 mt-4 pb-10 flex-col w-full md:flex md:flex-row md:max-w-5xl space-x-2 md:mb-12 space-y-12 md:space-y-0 items-center">
					<div className="w-full md:w-1/2">
						<p className="body2 ">{t("common.footer.credit.text")}</p>
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
