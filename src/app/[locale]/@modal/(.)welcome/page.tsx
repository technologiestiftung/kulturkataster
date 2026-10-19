import { isQuestionnaireVisible } from "@/server/utils/menuVisibility";
import { WelcomeModal } from "@/components/Modals/Pages/WelcomeModal";

export default async function WelcomeModalIntercepted() {
	return <WelcomeModal showQuestionnaire={await isQuestionnaireVisible()} />;
}
