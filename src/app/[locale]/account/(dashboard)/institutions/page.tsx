import { Suspense } from "react";
import { InstitutionsTable } from "@/components/Institution";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { AccountStoreGate } from "@/components/Account/AccountStoreGate";

export default function InstitutionsPage() {
	return (
		<div className="mx-auto md:px-10 w-full h-full min-h-0 flex flex-col">
			<div className="space-y-6 flex-1 min-h-0 flex flex-col">
				<Suspense fallback={<TableSkeleton columnCount={6} rowCount={10} />}>
					<AccountStoreGate>
						<InstitutionsTable />
					</AccountStoreGate>
				</Suspense>
			</div>
		</div>
	);
}
