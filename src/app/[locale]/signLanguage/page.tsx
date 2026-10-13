import { SignLanguageModal } from "@/components/Modals/Pages/SignLanguageModal";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.signLanguage",
);

export default function SignLanguageModalPage() {
	return <SignLanguageModal routePath="/signLanguage" />;
}
