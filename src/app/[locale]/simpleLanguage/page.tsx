import { SimpleLanguageInformationModal } from "@/components/Modals/Pages/SimpleLanguageInformationModal";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.simpleLanguage",
);

export default function SimpleLanguageModalPage() {
	return <SimpleLanguageInformationModal routePath="/simpleLanguage" />;
}
