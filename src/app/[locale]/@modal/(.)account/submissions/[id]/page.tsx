import { InstitutionDraftReviewModal } from "@/components/Institution/InstitutionDraftReviewModal";
import { requirePositiveIntParam } from "@/lib/utils/routeParams";

type InstitutionDraftReviewModalProps = {
	params: Promise<{ locale: string; id: string }>;
};

export default async function InstitutionDraftReviewModalPage({
	params,
}: InstitutionDraftReviewModalProps) {
	const { locale, id } = await params;
	const parsedId = requirePositiveIntParam(
		id,
		`/${locale}/account/institutions`,
	);

	return (
		<InstitutionDraftReviewModal
			submissionId={parsedId}
			routePath={`/account/submissions/${parsedId}`}
		/>
	);
}
