import { SignLanguageModal } from "@/components/Modals/Pages/SignLanguageModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Gebärdensprache (DGS) – Kulturkataster",
};

export default function SignLanguageModalPage() {
	return <SignLanguageModal />;
}
