import { InstitutionDraftEditModal } from "@/components/Institution/InstitutionDraftEditModal";
import { requirePositiveIntParam } from "@/lib/utils/routeParams";

type InstitutionDraftEditPageProps = {
	params: Promise<{ locale: string; id: string }>;
};

export default async function InstitutionDraftEditPage({
	params,
}: InstitutionDraftEditPageProps) {
	const { locale, id } = await params;
	const parsedId = requirePositiveIntParam(
		id,
		`/${locale}/account/institutions`,
	);

	return (
		<InstitutionDraftEditModal
			submissionId={parsedId}
			returnTo={`/account/submissions/${parsedId}`}
			shouldRefresh={false}
			routePath={`/account/submissions/${parsedId}/edit`}
		/>
	);
}
