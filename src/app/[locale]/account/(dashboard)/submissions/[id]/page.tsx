import { InstitutionDraftReviewModal } from "@/components/Institution/InstitutionDraftReviewModal";

type InstitutionDraftReviewModalProps = {
	params: Promise<{ id: string }>;
};

export default async function InstitutionDraftReviewModalPage({
	params,
}: InstitutionDraftReviewModalProps) {
	const { id } = await params;
	const parsedId = Number(id);
	return (
		<InstitutionDraftReviewModal
			submissionId={Number.isFinite(parsedId) ? parsedId : undefined}
			returnTo="/account/institutions"
			routePath={`/account/submissions/${id}`}
		/>
	);
}
