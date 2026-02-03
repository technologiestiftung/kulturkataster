import { UserFormModal } from "@/components/Users/UserFormModal";

export default function NewUserModal() {
	return (
		<UserFormModal
			mode="create"
			shouldRefresh={false}
			routePath="/account/users/new"
			closeTo="/account/users"
		/>
	);
}
