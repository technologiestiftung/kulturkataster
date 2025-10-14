"use client";

import { useModalStore } from "@/lib/store/modalStore";
import KRBLogo from "@/logos/KRB.svg";
import KukaLargeLogo from "@/logos/kuka-large.svg";
import KukaSmallLogo from "@/logos/kuka-small.svg";
import SenateLogo from "@/logos/senate.svg";
import { useTranslation } from "react-i18next";

const footerItems = [
	{ id: "about" },
	{ id: "imprint" },
	{ id: "privacy" },
	{ id: "accessibility" },
] as const;

export function ModalFooter() {
	const { t } = useTranslation("common");
	const { handleFooterItemClick } = useModalStore();

	return (
		<>
			<div className="ModalFooter-root flex justify-center w-full h-auto bg-secondary px-6 py-12 ">
				{/* Removed the modal components to prevent circular rendering */}

				<div className="w-full flex flex-col md:flex-row md:items-center md:justify-between">
					<div className="w-5/11 hidden md:flex items-center justify-center">
						<KukaLargeLogo className="h-auto w-36" />
					</div>
					<div className="block mb-8 md:hidden">
						<KukaSmallLogo className="h-auto w-16" />
					</div>
					<div className="w-full md:w-6/11 flex justify-center flex-col text-left">
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
								<span>{t("footer.email.label")}</span>
								<a
									className="underline"
									href={`mailto:${t("footer.email.address")}`}
								>
									{t("footer.email.address")}
								</a>
							</div>
							<div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-16 font-bold">
								{footerItems.map((item) => (
									<button
										className="body2 font-bold w-fit"
										key={item.id}
										onClick={() => handleFooterItemClick(item.id)}
									>
										{t(`footer.${item.id}`)}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="mt-4 mb-10 p-6 bg-background md:px-40 flex-col md:flex md:flex-row items-center justify-center gap-4">
				<span className="text-xs self-center">{t("footer.credit.text")}</span>
				<div className="flex gap-4 justify-end w-full pt-6">
					<KRBLogo className="w-full md:w-22 h-auto bg-white" />
					<SenateLogo className="w-full md:w-36 h-auto bg-white" />
				</div>
			</div>
		</>
	);
}
