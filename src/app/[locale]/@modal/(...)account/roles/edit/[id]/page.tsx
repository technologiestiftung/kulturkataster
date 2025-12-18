import { RoleEditModal } from "@/components/Roles/RoleEditModal";

export default function RoleEditModalIntercepted() {
	// TODO: Fetch role data based on params.id
	return (
		<RoleEditModal
			role={null}
			open={true}
			onOpenChange={() => {}}
			onSave={() => {}}
		/>
	);
}
