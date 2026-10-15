import { ImprintModal } from "@/components/Modals/Pages/ImprintModal";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.imprint",
);

export default function ImprintModalPage() {
	return <ImprintModal routePath="/imprint" />;
}
