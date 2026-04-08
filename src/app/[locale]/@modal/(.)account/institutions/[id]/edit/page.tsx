import { InstitutionEditModal } from "@/components/Institution/InstitutionEditModal";
import { requirePositiveIntParam } from "@/lib/utils/routeParams";

type EditInstitutionModalProps = {
	params: Promise<{ locale: string; id: string }>;
};

export default async function EditInstitutionModal({
	params,
}: EditInstitutionModalProps) {
	const { locale, id } = await params;
	const parsedId = requirePositiveIntParam(
		id,
		`/${locale}/account/institutions`,
	);

	return (
		<InstitutionEditModal
			institutionId={String(parsedId)}
			shouldRefresh={false}
			routePath={`/account/institutions/${parsedId}/edit`}
		/>
	);
}
