import { SubmissionReviewModal } from "@/components/Institution/SubmissionReviewModal";
import { requirePositiveIntParam } from "@/lib/utils/routeParams";

type SubmissionReviewModalPageProps = {
	params: Promise<{ locale: string; id: string }>;
};

export default async function SubmissionReviewModalPage({
	params,
}: SubmissionReviewModalPageProps) {
	const { locale, id } = await params;
	const parsedId = requirePositiveIntParam(
		id,
		`/${locale}/account/institutions`,
	);

	return (
		<SubmissionReviewModal
			submissionId={parsedId}
			returnTo="/account/institutions"
			routePath={`/account/submissions/${parsedId}`}
		/>
	);
}
