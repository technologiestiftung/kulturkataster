import { getCurrentUser } from "@/server/actions/auth";
import { userRepo } from "@/server/data/userRepo";
import { AccountEditModal } from "@/components/Modals/Pages/AccountEditModal";

export default async function AccountEditModalPage() {
	const currentUser = await getCurrentUser();
	if (!currentUser) {
		throw new Error("Unauthenticated access to protected route.");
	}
	const user = await userRepo.findById(currentUser.id);

	if (!currentUser.email || !user) {
		throw new Error("Authenticated user is missing.");
	}

	return (
		<AccountEditModal
			routePath="/account/edit"
			closeTo="/account"
			userId={user.id}
			email={currentUser.email}
			firstName={user.first_name}
			lastName={user.last_name}
		/>
	);
}
