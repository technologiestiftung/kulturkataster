import { TermsModal } from "@/components/Modals/Pages/TermsModal";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.terms",
);

export default function TermsModalPage() {
	return <TermsModal routePath="/terms" />;
}
