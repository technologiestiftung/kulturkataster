import { AboutModal } from "@/components/Modals/Pages/AboutModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Über das Kulturkataster",
};

export default function AboutPage() {
	return <AboutModal />;
}
