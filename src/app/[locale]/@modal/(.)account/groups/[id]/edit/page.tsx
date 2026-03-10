import { GroupFormModal } from "@/components/Groups/GroupFormModal";
import { requirePositiveIntParam } from "@/lib/utils/routeParams";

type PageProps = {
	params: Promise<{
		locale: string;
		id: string;
	}>;
};

export default async function EditGroupModal({ params }: PageProps) {
	const { locale, id } = await params;
	const parsedId = requirePositiveIntParam(id, `/${locale}/account/groups`);

	return (
		<GroupFormModal
			mode="edit"
			groupId={String(parsedId)}
			shouldRefresh={false}
			routePath={`/account/groups/${parsedId}/edit`}
		/>
	);
}
