"use client";
import { useModalStore } from "@/lib/store/modalStore";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import packageInfo from "../../../package.json";

const footerItems = [
	{ id: "about" },
	{ id: "imprint" },
	{ id: "privacy" },
	{ id: "accessibility" },
] as const;

const Footer: FC = () => {
	const { t } = useTranslation("common");
	const { handleFooterItemClick } = useModalStore();

	return (
		<footer
			className="Footer-root space-x-14 hidden min-w-fit h-8 bg-footer fixed right-0 bottom-0 md:flex justify-between px-2 py-1 ml-20"
			role="contentinfo"
		>
			<div className="body2 flex items-center gap-1">
				<p>{t("footer.projectBy")}</p>
			</div>

			<nav aria-label={t("footer.navigation")}>
				<ul className="flex gap-4 body2 font-bold">
					{footerItems.map((item) => (
						<li key={item.id}>
							<button
								className="body2 font-bold"
								onClick={() => handleFooterItemClick(item.id)}
							>
								{t(`footer.${item.id}`)}
							</button>
						</li>
					))}
					<li className="body2 font-normal">v{packageInfo.version}</li>
				</ul>
			</nav>
		</footer>
	);
};

export default Footer;
