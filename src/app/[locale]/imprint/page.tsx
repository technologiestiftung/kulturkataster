import { ImprintModal } from "@/components/Modals/Pages/ImprintModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Impressum – Kulturkataster",
};

export default function ImprintModalPage() {
	return <ImprintModal />;
}
