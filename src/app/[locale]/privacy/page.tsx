import { PrivacyModal } from "@/components/Modals/Pages/PrivacyModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Datenschutz – Kulturkataster",
};

export default function PrivacyModalPage() {
	return <PrivacyModal routePath="/privacy" />;
}
