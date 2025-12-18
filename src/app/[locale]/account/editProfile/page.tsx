"use client";

import { UserEditModal } from "@/components/Users/UserEditModal";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
	const router = useRouter();

	// TODO: Fetch current user data from auth context or API
	const currentUser = null;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleSave = (user: any) => {
		// TODO: Save user data
		console.log("Save user:", user);
		router.back();
	};

	const handleClose = () => {
		router.back();
	};

	return (
		<UserEditModal
			user={currentUser}
			open={true}
			onOpenChange={handleClose}
			onSave={handleSave}
			onDelete={() => {}}
			onResendEmail={() => {}}
			onResetPassword={() => {}}
			onResendCompliance={() => {}}
		/>
	);
}
