import { TermsModal } from "@/components/Modals/Pages/TermsModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "AGB – Kulturkataster",
};

export default function TermsModalPage() {
	return <TermsModal routePath="/terms" />;
}
