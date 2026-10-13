import { InformationModal } from "@/components/Modals/Pages/InformationModal";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.info",
);

export default function InformationModalPage() {
	return <InformationModal routePath="/info" />;
}
