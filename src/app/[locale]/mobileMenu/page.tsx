import { MobileMenuModal } from "@/components/Modals/Pages/MobileMenuModal";
import { getHiddenMenuItems } from "@/server/utils/menuVisibility";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.mobileMenu",
);

export default async function MobileMenuModalPage() {
	return <MobileMenuModal hiddenMenuItems={await getHiddenMenuItems()} />;
}
