import { getOpenQuestionnaire } from "@/server/actions/questionnaires";
import { getCategoriesWithSubcategories } from "@/server/actions/categories";
import { getGuestCaptchaWidgetConfig } from "@/server/captcha/cap";
import { QuestionnaireWizardModal } from "@/components/Questionnaire/QuestionnaireWizardModal";
import { QuestionnaireUnavailable } from "@/components/Questionnaire/QuestionnaireUnavailable";
import {
	parseOptionalPositiveIntParam,
	parseOptionalStringParam,
} from "@/lib/utils/routeParams";

export default async function QuestionnaireModalIntercepted({
	searchParams,
}: {
	searchParams: Promise<{
		institutionId?: string | string[];
		submissionId?: string | string[];
		step?: string | string[];
		thankyou?: string | string[];
	}>;
}) {
	const [result, categoryGroups, resolvedSearchParams, captchaConfig] =
		await Promise.all([
			getOpenQuestionnaire(),
			getCategoriesWithSubcategories(),
			searchParams,
			getGuestCaptchaWidgetConfig(),
		]);

	if (!result.ok) {
		return <QuestionnaireUnavailable routePath="/questionnaire" />;
	}

	const thankyouParam = resolvedSearchParams.thankyou;
	const showThankYou = Array.isArray(thankyouParam)
		? thankyouParam.includes("1") || thankyouParam.includes("true")
		: thankyouParam === "1" || thankyouParam === "true";

	return (
		<QuestionnaireWizardModal
			routePath="/questionnaire"
			questionnaire={result.questionnaire}
			categoryGroups={categoryGroups}
			initialInstitutionId={parseOptionalPositiveIntParam(
				resolvedSearchParams.institutionId,
			)}
			initialSubmissionId={parseOptionalPositiveIntParam(
				resolvedSearchParams.submissionId,
			)}
			initialStepId={parseOptionalStringParam(resolvedSearchParams.step)}
			initialShowThankYou={showThankYou}
			captchaConfig={captchaConfig}
		/>
	);
}
