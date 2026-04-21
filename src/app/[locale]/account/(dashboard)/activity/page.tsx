import { Suspense } from "react";
import { ActivityList } from "@/components/Activity";
import { ActivityListSkeleton } from "@/components/Activity/ActivityListSkeleton";
import { AccountStoreGate } from "@/components/Account/AccountStoreGate";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Activity – Kulturkataster",
};

export default function ActivityPage() {
	return (
		<div className="space-y-6 px-4 md:px-10 py-2 md:py-4 h-full">
			<Suspense fallback={<ActivityListSkeleton showFilters rowCount={8} />}>
				<AccountStoreGate>
					<ActivityList />
				</AccountStoreGate>
			</Suspense>
		</div>
	);
}
