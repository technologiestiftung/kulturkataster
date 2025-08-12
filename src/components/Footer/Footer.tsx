"use client";
import { useModalStore } from "@/lib/store/modalStore";
import { FC } from "react";
import { useTranslation } from "react-i18next";

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
		<div className="Footer-root hidden min-w-fit h-8 bg-footer absolute right-0 bottom-0 md:flex justify-between px-2 py-1 ml-20">
			{/* Modals are now rendered by ModalProvider */}

			<div className="pr-14 body2">
				<p>{t("footer.projectBy")}</p>
			</div>
			<ul className="flex gap-4 body2 font-bold">
				{footerItems.map((item) => (
					<button
						className="body2 font-bold"
						key={item.id}
						onClick={() => handleFooterItemClick(item.id)}
					>
						{t(`footer.${item.id}`)}
					</button>
				))}
			</ul>
		</div>
	);
};

export default Footer;
