import { MobileMenuModal } from "@/components/Modals/Pages/MobileMenuModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Mobiles Menü – Kulturkataster",
};

export default function MobileMenuModalPage() {
	return <MobileMenuModal />;
}
