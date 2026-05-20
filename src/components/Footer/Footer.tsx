"use client";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import packageInfo from "../../../package.json";
import { usePathname } from "next/navigation";
import { getModalLink } from "@/lib/utils/modalRouting";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import Link from "next/link";

const footerItems = [
	{ id: "about" },
	{ id: "imprint" },
	{ id: "privacy" },
	{ id: "terms" },
	{ id: "accessibility" },
	{ id: "simpleLanguageInformation" },
	{ id: "signLanguageInformationShort" },
] as const;

interface FooterProps {
	ariaLabel?: string;
	envHint?: string;
}

const Footer: FC<FooterProps> = ({ ariaLabel, envHint }) => {
	const { t } = useTranslation("common");
	const pathname = usePathname();
	const toLocalePath = useLocalePath();
	const isListRoute = pathname?.replace(/\/$/, "").endsWith("/list");

	if (isListRoute) return <></>;

	return (
		<footer
			className="Footer-root z-51 space-x-14 hidden min-w-fit h-8 bg-footer fixed right-0 bottom-0 md:flex justify-between px-2 py-1 ml-20"
			role="contentinfo"
			aria-label={ariaLabel ?? t("footerLandmark")}
		>
			<div className="body2 flex items-center gap-1 text-nowrap truncate">
				<p>{t("footer.projectBy")}</p>
			</div>

			<nav aria-label={t("footer.navigationAriaLabel")}>
				<ul className="flex gap-4 body2 font-bold">
					{footerItems.map((item) => (
						<li key={item.id}>
							{(() => {
								const link = getModalLink(item.id, toLocalePath);
								return (
									<Link
										className="body2 font-bold"
										href={link.url}
										target={link.target}
										rel="noopener noreferrer"
									>
										{t(`footer.${item.id}`)}
									</Link>
								);
							})()}
						</li>
					))}
					<li className="body2 font-normal">v{packageInfo.version}</li>
					{envHint && (
						<li className="body2 font-normal text-muted-foreground">
							[{envHint}]
						</li>
					)}
				</ul>
			</nav>
		</footer>
	);
};

export default Footer;
