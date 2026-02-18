import { InstitutionDraftIntroModal } from "@/components/Institution/InstitutionDraftIntroModal";
import { getCurrentUser } from "@/server/actions/auth";

export default async function InstitutionPage({
	searchParams,
}: {
	searchParams: Promise<{ thankyou?: string | string[] }>;
}) {
	const user = await getCurrentUser();
	const resolvedSearchParams = await searchParams;
	const thankyouParam = resolvedSearchParams?.thankyou;
	const showThankYou = Array.isArray(thankyouParam)
		? thankyouParam.includes("1") || thankyouParam.includes("true")
		: thankyouParam === "1" || thankyouParam === "true";
	return (
		<InstitutionDraftIntroModal
			routePath="/institution"
			isAuthenticated={Boolean(user)}
			showThankYou={showThankYou}
		/>
	);
}
