import { InstitutionDraftWizardModal } from "@/components/Institution/InstitutionDraftWizardModal";
import { getCurrentProfile } from "@/server/actions/auth";
import { getCapWidgetConfig } from "@/server/captcha/cap";

export default async function InstitutionSubmissionModalIntercepted() {
	const profile = await getCurrentProfile();
	const captchaConfig = profile ? null : getCapWidgetConfig();

	return (
		<InstitutionDraftWizardModal
			routePath="/institution/submission"
			profile={profile}
			captchaConfig={captchaConfig}
		/>
	);
}
