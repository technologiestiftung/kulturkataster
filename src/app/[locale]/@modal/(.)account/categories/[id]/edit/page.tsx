import { CategoryFormModal } from "@/components/Categories";

type EditCategoryModalProps = {
	params: Promise<{ id: string }>;
};

export default async function EditCategoryModal({
	params,
}: EditCategoryModalProps) {
	const { id } = await params;
	return (
		<CategoryFormModal
			mode="edit"
			categoryId={id}
			shouldRefresh={false}
			routePath={`/account/categories/${id}/edit`}
			returnTo="/account/categories"
		/>
	);
}
