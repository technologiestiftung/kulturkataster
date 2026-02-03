import { CategoryFormModal } from "@/components/Categories";

export default function NewCategoryPage() {
	return (
		<CategoryFormModal
			mode="create"
			shouldRefresh={false}
			routePath="/account/categories/new"
			closeTo="/account/categories"
		/>
	);
}
