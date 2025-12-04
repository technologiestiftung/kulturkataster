import { AboutModal } from "@/components/Modals/Pages/AboutModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Über das Projekt – Kulturkataster",
};

export default function AboutModalPage() {
	return <AboutModal />;
}
