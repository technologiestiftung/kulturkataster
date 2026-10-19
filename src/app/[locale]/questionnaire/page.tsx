import { redirect } from "next/navigation";
import { getOpenQuestionnaire } from "@/server/actions/questionnaires";
import { localePath } from "@/lib/utils/localePath";
import { getCategoriesWithSubcategories } from "@/server/actions/categories";
import { getGuestCaptchaWidgetConfig } from "@/server/captcha/cap";
import { QuestionnaireWizardModal } from "@/components/Questionnaire/QuestionnaireWizardModal";
import { QuestionnaireUnavailable } from "@/components/Questionnaire/QuestionnaireUnavailable";
import {
	parseOptionalPositiveIntParam,
	parseOptionalStringParam,
} from "@/lib/utils/routeParams";

export default async function QuestionnairePage({
	params,
	searchParams,
}: {
	params: Promise<{ locale: string }>;
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

	// Without an open questionnaire there is nothing to show; the entry points are hidden too.
	if (!result.ok && result.error === "not_found") {
		redirect(localePath((await params).locale, "/map"));
	}
	if (!result.ok) {
		return <QuestionnaireUnavailable routePath="/questionnaire" />;
	}

	// Same "?thankyou=1"/"true" shape as /institution's InstitutionDraftIntroModal.
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
