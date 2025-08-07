"use client";

import KRBLogo from "@/logos/KRB.svg";
import KukaLargeLogo from "@/logos/kuka-large.svg";
import KukaSmallLogo from "@/logos/kuka-small.svg";
import SenateLogo from "@/logos/senate.svg";
import TechnologieStiftungLogo from "@/logos/technologiestiftung.svg";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityModal } from "../Modals/Pages/AccessibilityModal";
import { ImprintModal } from "../Modals/Pages/ImprintModal";
import { PrivacyModal } from "../Modals/Pages/PrivacyModal";
import { AboutModal } from "./Pages/AboutModal";

const footerItems = [
	{ id: "about" },
	{ id: "imprint" },
	{ id: "privacy" },
	{ id: "accessibility" },
] as const;

export function ModalFooter() {
	const { t } = useTranslation("common");
	const [aboutModalOpen, setAboutModalOpen] = useState(false);
	const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
	const [imprintModalOpen, setImprintModalOpen] = useState(false);
	const [accessibilityModalOpen, setAccessibilityModalOpen] = useState(false);

	const handleItemClick = (id: string) => {
		if (id === "about") {
			setAboutModalOpen(true);
			return;
		}
		if (id === "imprint") {
			setImprintModalOpen(true);
			return;
		}
		if (id === "privacy") {
			setPrivacyModalOpen(true);
			return;
		}
		if (id === "accessibility") {
			setAccessibilityModalOpen(true);
			return;
		}
	};

	return (
		<>
			<div className="ModalFooter-root flex justify-center w-full h-auto bg-secondary px-6 py-12 ">
				<AboutModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />
				<PrivacyModal
					open={privacyModalOpen}
					onOpenChange={setPrivacyModalOpen}
				/>
				<ImprintModal
					open={imprintModalOpen}
					onOpenChange={setImprintModalOpen}
				/>
				<AccessibilityModal
					open={accessibilityModalOpen}
					onOpenChange={setAccessibilityModalOpen}
				/>

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
								<span>{t("footer.telephone.label")}</span>
								<span className="underline">
									{t("footer.telephone.number")}
								</span>
							</div>
							<div className="flex gap-2">
								<span>{t("footer.email.label")}</span>
								<span className="underline">{t("footer.email.address")}</span>
							</div>
							<div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-16 font-bold">
								{footerItems.map((item) => (
									<button
										className="body2 font-bold w-fit"
										key={item.id}
										onClick={() => handleItemClick(item.id)}
									>
										{t(`footer.${item.id}`)}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="mt-4 mb-10 p-6  md:px-40 flex-col md:flex md:flex-row items-center justify-center gap-4">
				<span className="text-xs self-center">{t("footer.credit.text")}</span>
				<div className="flex gap-4 w-full pt-6">
					<KRBLogo className="w-full md:w-22 h-auto" />
					<TechnologieStiftungLogo className="w-full md:w-48 h-auto" />
					<SenateLogo className="w-full md:w-36 h-auto" />
				</div>
			</div>
		</>
	);
}
