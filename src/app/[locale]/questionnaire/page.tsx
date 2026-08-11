import { getOpenQuestionnaire } from "@/server/actions/questionnaires";
import { getCategoriesWithSubcategories } from "@/server/actions/categories";
import { QuestionnaireWizardModal } from "@/components/Questionnaire/QuestionnaireWizardModal";
import { QuestionnaireUnavailable } from "@/components/Questionnaire/QuestionnaireUnavailable";

export default async function QuestionnairePage() {
	const [result, categoryGroups] = await Promise.all([
		getOpenQuestionnaire(),
		getCategoriesWithSubcategories(),
	]);

	if (!result.ok) {
		return <QuestionnaireUnavailable routePath="/questionnaire" />;
	}

	return (
		<QuestionnaireWizardModal
			routePath="/questionnaire"
			questionnaire={result.questionnaire}
			categoryGroups={categoryGroups}
		/>
	);
}
