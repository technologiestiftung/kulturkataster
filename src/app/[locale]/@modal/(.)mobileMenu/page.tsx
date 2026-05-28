import { MobileMenuModal } from "@/components/Modals/Pages/MobileMenuModal";
import { parseHiddenMenuItems } from "@/lib/utils/menuVisibility";

export default function MobileMenuModalIntercepted() {
	return (
		<MobileMenuModal
			hiddenMenuItems={parseHiddenMenuItems(process.env.HIDDEN_MENU_ITEMS)}
		/>
	);
}
