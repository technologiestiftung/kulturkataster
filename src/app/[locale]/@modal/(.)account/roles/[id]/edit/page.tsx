import { RoleFormModal } from "@/components/Roles/RoleFormModal";

type PageProps = {
	params: Promise<{
		id: string;
	}>;
};

export default async function EditRoleModal({ params }: PageProps) {
	const { id } = await params;
	return (
		<RoleFormModal
			mode="edit"
			roleId={id}
			shouldRefresh={false}
			routePath={`/account/roles/${id}/edit`}
			returnTo="/account/roles"
		/>
	);
}
