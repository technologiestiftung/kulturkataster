import { GroupFormModal } from "@/components/Groups/GroupFormModal";

export default function NewGroupModal() {
	return (
		<GroupFormModal
			mode="create"
			shouldRefresh={false}
			routePath="/account/groups/new"
			returnTo="/account/groups"
		/>
	);
}
