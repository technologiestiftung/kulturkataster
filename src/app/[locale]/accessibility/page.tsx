import { AccessibilityModal } from "@/components/Modals/Pages/AccessibilityModal";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Barrierefreiheit – Kulturkataster",
};

export default function AccessibilityModalPage() {
	return <AccessibilityModal routePath="/accessibility" />;
}
