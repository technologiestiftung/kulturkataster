import { CategoriesTable } from "@/components/Categories";

export default function CategoriesPage() {
	return (
		<div className="container mx-auto px-10 w-full h-full min-h-0 flex flex-col">
			<div className="flex-1 min-h-0 flex flex-col">
				<CategoriesTable />
			</div>
		</div>
	);
}
