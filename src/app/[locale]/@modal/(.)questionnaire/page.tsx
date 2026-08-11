import { getCurrentProfile } from "@/server/actions/auth";
import { getOpenQuestionnaire } from "@/server/actions/questionnaires";
import { QuestionnaireWizardModal } from "@/components/Questionnaire/QuestionnaireWizardModal";
import { QuestionnaireUnavailable } from "@/components/Questionnaire/QuestionnaireUnavailable";

export default async function QuestionnaireModalIntercepted() {
	const [profile, result] = await Promise.all([
		getCurrentProfile(),
		getOpenQuestionnaire(),
	]);

	if (!result.ok) {
		return <QuestionnaireUnavailable routePath="/questionnaire" />;
	}

	return (
		<QuestionnaireWizardModal
			routePath="/questionnaire"
			questionnaire={result.questionnaire}
			profile={profile}
		/>
	);
}
