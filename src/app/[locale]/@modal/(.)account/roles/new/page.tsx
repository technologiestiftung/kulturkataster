import { RoleFormModal } from "@/components/Roles/RoleFormModal";

export default function NewRoleModal() {
	return (
		<RoleFormModal
			mode="create"
			shouldRefresh={false}
			routePath="/account/roles/new"
			returnTo="/account/roles"
		/>
	);
}
