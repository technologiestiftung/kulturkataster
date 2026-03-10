import { InstitutionDraftEditModal } from "@/components/Institution/InstitutionDraftEditModal";
import { requirePositiveIntParam } from "@/lib/utils/routeParams";

type InstitutionDraftEditModalProps = {
	params: Promise<{ locale: string; id: string }>;
};

export default async function InstitutionDraftEditModalPage({
	params,
}: InstitutionDraftEditModalProps) {
	const { locale, id } = await params;
	const parsedId = requirePositiveIntParam(
		id,
		`/${locale}/account/institutions`,
	);

	return (
		<InstitutionDraftEditModal
			submissionId={parsedId}
			routePath={`/account/submissions/${parsedId}/edit`}
		/>
	);
}
