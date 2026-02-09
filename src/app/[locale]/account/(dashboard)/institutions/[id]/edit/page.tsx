import { InstitutionEditModal } from "@/components/Institution/InstitutionEditModal";

type EditInstitutionPageProps = {
	params: Promise<{ id: string }>;
};

export default async function EditInstitutionPage({
	params,
}: EditInstitutionPageProps) {
	const { id } = await params;
	return (
		<InstitutionEditModal
			institutionId={id}
			shouldRefresh={false}
			routePath={`/account/institutions/${id}/edit`}
			returnTo="/account/institutions"
		/>
	);
}
