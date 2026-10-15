import { AccessibilityModal } from "@/components/Modals/Pages/AccessibilityModal";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.accessibility",
);

export default function AccessibilityModalPage() {
	return <AccessibilityModal routePath="/accessibility" />;
}
