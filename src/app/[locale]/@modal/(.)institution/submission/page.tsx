import { InstitutionDraftWizardModal } from "@/components/Institution/InstitutionDraftWizardModal";
import { getCurrentProfile } from "@/server/actions/auth";

export default async function InstitutionSubmissionModalIntercepted() {
	const profile = await getCurrentProfile();

	return (
		<InstitutionDraftWizardModal
			routePath="/institution/submission"
			profile={profile}
		/>
	);
}
