import { Suspense } from "react";
import { RolesTable } from "@/components/Roles";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { AccountStoreGate } from "@/components/Account/AccountStoreGate";

export default function RolesPage() {
	return (
		<div className="mx-auto md:px-10 w-full h-full min-h-0 flex flex-col">
			<div className="flex-1 min-h-0 flex flex-col">
				<Suspense fallback={<TableSkeleton columnCount={4} rowCount={8} />}>
					<AccountStoreGate>
						<RolesTable />
					</AccountStoreGate>
				</Suspense>
			</div>
		</div>
	);
}
