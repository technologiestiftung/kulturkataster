import { MobileMenuModal } from "@/components/Modals/Pages/MobileMenuModal";
import { parseHiddenMenuItems } from "@/lib/utils/menuVisibility";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.mobileMenu",
);

export default function MobileMenuModalPage() {
	return (
		<MobileMenuModal
			hiddenMenuItems={parseHiddenMenuItems(process.env.HIDDEN_MENU_ITEMS)}
		/>
	);
}
