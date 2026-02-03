import { RoleFormModal } from "@/components/Roles/RoleFormModal";

export default function NewRolePage() {
	return (
		<RoleFormModal
			mode="create"
			shouldRefresh={false}
			routePath="/account/roles/new"
			closeTo="/account/roles"
		/>
	);
}
