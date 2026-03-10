import { CategoryFormModal } from "@/components/Categories";
import { requirePositiveIntParam } from "@/lib/utils/routeParams";

type EditCategoryModalProps = {
	params: Promise<{ locale: string; id: string }>;
};

export default async function EditCategoryModal({
	params,
}: EditCategoryModalProps) {
	const { locale, id } = await params;
	const parsedId = requirePositiveIntParam(id, `/${locale}/account/categories`);

	return (
		<CategoryFormModal
			mode="edit"
			categoryId={String(parsedId)}
			shouldRefresh={false}
			routePath={`/account/categories/${parsedId}/edit`}
		/>
	);
}
