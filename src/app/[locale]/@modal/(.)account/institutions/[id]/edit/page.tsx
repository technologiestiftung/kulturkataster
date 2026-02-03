import { InstitutionEditModal } from "@/components/Institution/InstitutionEditModal";

type EditInstitutionModalProps = {
	params: Promise<{ id: string }>;
};

export default async function EditInstitutionModal({
	params,
}: EditInstitutionModalProps) {
	const { id } = await params;
	return (
		<InstitutionEditModal
			institutionId={id}
			shouldRefresh={false}
			routePath={`/account/institutions/${id}/edit`}
			closeTo="/account/institutions"
		/>
	);
}
