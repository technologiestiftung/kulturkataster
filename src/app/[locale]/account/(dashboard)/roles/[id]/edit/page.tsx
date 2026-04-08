import { RoleFormModal } from "@/components/Roles/RoleFormModal";
import { requirePositiveIntParam } from "@/lib/utils/routeParams";

type PageProps = {
	params: Promise<{
		locale: string;
		id: string;
	}>;
};

export default async function EditRolePage({ params }: PageProps) {
	const { locale, id } = await params;
	const parsedId = requirePositiveIntParam(id, `/${locale}/account/roles`);

	return (
		<RoleFormModal
			mode="edit"
			roleId={String(parsedId)}
			shouldRefresh={false}
			routePath={`/account/roles/${parsedId}/edit`}
			returnTo="/account/roles"
		/>
	);
}
