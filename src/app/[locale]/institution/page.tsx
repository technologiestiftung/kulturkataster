import { InstitutionDraftIntroModal } from "@/components/Institution/InstitutionDraftIntroModal";
import { getCurrentUser } from "@/server/actions/auth";

export default async function InstitutionPage() {
	const user = await getCurrentUser();
	return (
		<InstitutionDraftIntroModal
			routePath="/institution"
			isAuthenticated={Boolean(user)}
		/>
	);
}
