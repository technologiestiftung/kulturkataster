import { isQuestionnaireVisible } from "@/server/utils/menuVisibility";
import { WelcomeModal } from "@/components/Modals/Pages/WelcomeModal";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.welcome",
	{
		absolute: true,
	},
);

export default async function WelcomeModalPage() {
	return <WelcomeModal showQuestionnaire={await isQuestionnaireVisible()} />;
}
