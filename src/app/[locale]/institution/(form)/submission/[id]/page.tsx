import { InstitutionDraftReviewModal } from "@/components/Institution/InstitutionDraftReviewModal";

type InstitutionDraftReviewPageProps = {
	params: Promise<{ id: string }>;
};

export default async function InstitutionDraftReviewPage({
	params,
}: InstitutionDraftReviewPageProps) {
	const { id } = await params;
	const parsedId = Number(id);
	return (
		<InstitutionDraftReviewModal
			submissionId={Number.isFinite(parsedId) ? parsedId : undefined}
			returnTo="/institution/submission"
			editBasePath="/institution/submission"
		/>
	);
}
