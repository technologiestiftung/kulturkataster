import { WelcomeModal } from "@/components/Modals/Pages/WelcomeModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Willkommen im Kulturkataster",
};

export default function WelcomeModalPage() {
	return <WelcomeModal />;
}
