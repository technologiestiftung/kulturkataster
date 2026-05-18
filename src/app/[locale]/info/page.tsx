import { InformationModal } from "@/components/Modals/Pages/InformationModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Infos und Services – Kulturkataster",
};

export default function InformationModalPage() {
	return <InformationModal routePath="/info" />;
}
