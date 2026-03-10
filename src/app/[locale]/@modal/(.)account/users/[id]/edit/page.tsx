import { UserFormModal } from "@/components/Users/UserFormModal";

type PageProps = {
	params: Promise<{
		id: string;
	}>;
};

export default async function EditUserModal({ params }: PageProps) {
	const { id } = await params;

	return (
		<UserFormModal
			mode="edit"
			userId={id}
			routePath={`/account/users/${id}/edit`}
			returnTo="/account/users"
		/>
	);
}
