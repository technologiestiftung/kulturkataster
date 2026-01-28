import { GroupFormModal } from "@/components/Groups/GroupFormModal";

type PageProps = {
	params: Promise<{
		id: string;
	}>;
};

export default async function EditGroupModal({ params }: PageProps) {
	const { id } = await params;
	return <GroupFormModal mode="edit" groupId={id} shouldRefresh={false} />;
}
