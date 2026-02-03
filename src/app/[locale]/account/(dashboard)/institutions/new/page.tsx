import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";

export default function NewInstitutionPage() {
	return (
		<InstitutionFormModal
			mode="create"
			shouldRefresh={false}
			routePath="/account/institutions/new"
			closeTo="/account/institutions"
		/>
	);
}
