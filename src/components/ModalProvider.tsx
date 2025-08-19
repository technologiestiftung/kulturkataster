"use client";

import { AboutModal } from "@/components/Modals/Pages/AboutModal";
import { AccessibilityModal } from "@/components/Modals/Pages/AccessibilityModal";
import { ImprintModal } from "@/components/Modals/Pages/ImprintModal";
import { InformationModal } from "@/components/Modals/Pages/InformationModal";
import { MobileMenuModal } from "@/components/Modals/Pages/MobileMenuModal";
import { PrivacyModal } from "@/components/Modals/Pages/PrivacyModal";
import { useModalStore } from "@/lib/store/modalStore";
import { DownloadModal } from "./Modals/Pages/DownloadModal";

export function ModalProvider() {
	const {
		aboutModalOpen,
		privacyModalOpen,
		imprintModalOpen,
		accessibilityModalOpen,
		informationModalOpen,
		downloadModalOpen,
		downloadModalMode,
		mobileMenuModalOpen,
		setAboutModalOpen,
		setPrivacyModalOpen,
		setImprintModalOpen,
		setAccessibilityModalOpen,
		setInformationModalOpen,
		setDownloadModalOpen,
		setMobileMenuModalOpen,
	} = useModalStore();

	return (
		<>
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
			<InformationModal
				open={informationModalOpen}
				onOpenChange={setInformationModalOpen}
			/>
			<DownloadModal
				open={downloadModalOpen}
				onOpenChange={setDownloadModalOpen}
				mode={downloadModalMode}
			/>
			<MobileMenuModal
				open={mobileMenuModalOpen}
				onOpenChange={setMobileMenuModalOpen}
			/>
		</>
	);
}
