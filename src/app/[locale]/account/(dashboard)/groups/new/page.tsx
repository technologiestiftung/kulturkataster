import { GroupFormModal } from "@/components/Groups/GroupFormModal";

export default function NewGroupPage() {
	return (
		<GroupFormModal
			mode="create"
			shouldRefresh={false}
			routePath="/account/groups/new"
			returnTo="/account/groups"
		/>
	);
}
