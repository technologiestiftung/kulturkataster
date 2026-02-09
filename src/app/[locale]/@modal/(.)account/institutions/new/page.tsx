import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";

export default function NewInstitutionModal() {
	return (
		<InstitutionFormModal
			mode="create"
			shouldRefresh={false}
			routePath="/account/institutions/new"
			returnTo="/account/institutions"
		/>
	);
}
