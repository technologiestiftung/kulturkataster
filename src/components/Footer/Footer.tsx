"use client";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityModal } from "../Modals/Pages/AccessibilityModal";
import { ImprintModal } from "../Modals/Pages/ImprintModal";
import { InformationModal } from "../Modals/Pages/InformationModal";
import { PrivacyModal } from "../Modals/Pages/PrivacyModal";

const footerItems = [
	{ id: "about" },
	{ id: "imprint" },
	{ id: "privacy" },
	{ id: "accessibility" },
] as const;

const Footer: FC = ({}) => {
	const { t } = useTranslation("common");

	const [infoModalOpen, setInfoModalOpen] = useState(false);
	const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
	const [imprintModalOpen, setImprintModalOpen] = useState(false);
	const [accessibilityModalOpen, setAccessibilityModalOpen] = useState(false);

	const handleItemClick = (id: string) => {
		if (id === "about") {
			setInfoModalOpen(true);
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
		<div className="Footer-root hidden min-w-fit h-8 bg-footer absolute right-0 bottom-0 md:flex justify-between px-2 py-1 ml-20">
			<InformationModal open={infoModalOpen} onOpenChange={setInfoModalOpen} />
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

			<div className="pr-14 body2">
				<p>Ein Projekt der Kulturraum Berlin gGmbH</p>
			</div>
			<ul className="flex gap-4 body2 font-bold">
				{footerItems.map((item) => (
					<button
						className="body2 font-bold"
						key={item.id}
						onClick={() => handleItemClick(item.id)}
					>
						{t(`footer.${item.id}`)}
					</button>
				))}
			</ul>
		</div>
	);
};

export default Footer;
