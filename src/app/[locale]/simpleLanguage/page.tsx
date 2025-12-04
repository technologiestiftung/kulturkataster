import { SimpleLanguageInformationModal } from "@/components/Modals/Pages/SimpleLanguageInformationModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Leichte Sprache – Kulturkataster",
};

export default function SimpleLanguageModalPage() {
	return <SimpleLanguageInformationModal />;
}
