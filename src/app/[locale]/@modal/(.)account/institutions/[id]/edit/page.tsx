import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";

type EditInstitutionModalProps = {
	params: Promise<{ id: string }>;
};

export default async function EditInstitutionModal({
	params,
}: EditInstitutionModalProps) {
	const { id } = await params;
	return <InstitutionFormModal mode="edit" institutionId={id} />;
}
