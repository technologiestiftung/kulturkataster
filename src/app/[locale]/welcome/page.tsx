import { WelcomeModal } from "@/components/Modals/Pages/WelcomeModal";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.welcome",
	{
		absolute: true,
	},
);

export default function WelcomeModalPage() {
	return <WelcomeModal />;
}
