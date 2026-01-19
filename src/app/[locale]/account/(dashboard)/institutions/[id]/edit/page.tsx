import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";

type EditInstitutionPageProps = {
	params: Promise<{ id: string }>;
};

export default async function EditInstitutionPage({
	params,
}: EditInstitutionPageProps) {
	const { id } = await params;
	return <InstitutionFormModal mode="edit" institutionId={id} />;
}
