import { GroupEditModal } from "@/components/Groups/GroupEditModal";

export default function GroupEditPage() {
	// TODO: Fetch group data based on params.id
	return (
		<GroupEditModal
			group={null}
			open={true}
			onOpenChange={() => {}}
			onSave={() => {}}
			onDelete={() => {}}
		/>
	);
}
