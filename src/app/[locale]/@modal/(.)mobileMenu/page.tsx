import { MobileMenuModal } from "@/components/Modals/Pages/MobileMenuModal";
import { getHiddenMenuItems } from "@/server/utils/menuVisibility";

export default async function MobileMenuModalIntercepted() {
	return <MobileMenuModal hiddenMenuItems={await getHiddenMenuItems()} />;
}
