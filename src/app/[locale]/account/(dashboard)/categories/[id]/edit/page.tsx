import { CategoryFormModal } from "@/components/Categories";

type EditCategoryPageProps = {
	params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({
	params,
}: EditCategoryPageProps) {
	const { id } = await params;
	return (
		<CategoryFormModal
			mode="edit"
			categoryId={id}
			shouldRefresh={false}
			routePath={`/account/categories/${id}/edit`}
			closeTo="/account/categories"
		/>
	);
}
