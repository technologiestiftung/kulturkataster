import { SubmissionInstitutionFormModal } from "@/components/Institution/SubmissionInstitutionFormModal";

type SubmissionEditPageProps = {
	params: Promise<{ id: string }>;
};

export default async function SubmissionEditPage({
	params,
}: SubmissionEditPageProps) {
	const { id } = await params;
	const parsedId = Number(id);
	return (
		<SubmissionInstitutionFormModal
			submissionId={Number.isFinite(parsedId) ? parsedId : undefined}
			returnTo="/institution/submission"
		/>
	);
}
