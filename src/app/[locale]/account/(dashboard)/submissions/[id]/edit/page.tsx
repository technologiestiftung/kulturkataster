import { InstitutionDraftEditModal } from "@/components/Institution/InstitutionDraftEditModal";

type InstitutionDraftEditPageProps = {
	params: Promise<{ id: string }>;
};

export default async function InstitutionDraftEditPage({
	params,
}: InstitutionDraftEditPageProps) {
	const { id } = await params;
	const parsedId = Number(id);
	return (
		<InstitutionDraftEditModal
			submissionId={Number.isFinite(parsedId) ? parsedId : undefined}
			returnTo="/account/institutions"
			shouldRefresh={false}
			routePath={`/account/submissions/${id}/edit`}
		/>
	);
}
