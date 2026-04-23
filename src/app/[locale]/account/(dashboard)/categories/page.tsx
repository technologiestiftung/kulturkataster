import { CategoriesTable } from "@/components/Categories";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { AccountStoreGate } from "@/components/Account/AccountStoreGate";

export default function CategoriesPage() {
	return (
		<div className="mx-auto md:px-10 w-full h-full min-h-0 flex flex-col">
			<div className="flex-1 min-h-0 flex flex-col">
				<AccountStoreGate
					fallback={<TableSkeleton columnCount={4} rowCount={8} />}
				>
					<CategoriesTable />
				</AccountStoreGate>
			</div>
		</div>
	);
}
