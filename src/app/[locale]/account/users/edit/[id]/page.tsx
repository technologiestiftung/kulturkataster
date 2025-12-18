import { UserEditModal } from "@/components/Users/UserEditModal";

export default function UserEditPage() {
	// TODO: Fetch user data based on params.id
	return (
		<UserEditModal
			user={null}
			open={true}
			onOpenChange={() => {}}
			onSave={() => {}}
			onDelete={() => {}}
			onResendEmail={() => {}}
			onResetPassword={() => {}}
			onResendCompliance={() => {}}
		/>
	);
}
