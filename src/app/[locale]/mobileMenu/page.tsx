import { MobileMenuModal } from "@/components/Modals/Pages/MobileMenuModal";
import { parseHiddenMenuItems } from "@/lib/utils/menuVisibility";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Mobiles Menü – Kulturkataster",
};

export default function MobileMenuModalPage() {
	return (
		<MobileMenuModal
			hiddenMenuItems={parseHiddenMenuItems(process.env.HIDDEN_MENU_ITEMS)}
		/>
	);
}
