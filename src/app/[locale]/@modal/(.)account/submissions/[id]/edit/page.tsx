import { InstitutionDraftEditModal } from "@/components/Institution/InstitutionDraftEditModal";

type InstitutionDraftEditModalProps = {
	params: Promise<{ id: string }>;
};

export default async function InstitutionDraftEditModalPage({
	params,
}: InstitutionDraftEditModalProps) {
	const { id } = await params;
	const parsedId = Number(id);
	return (
		<InstitutionDraftEditModal
			submissionId={Number.isFinite(parsedId) ? parsedId : undefined}
			routePath={`/account/submissions/${id}/edit`}
			returnTo={`/account/submissions/${id}`}
		/>
	);
}
