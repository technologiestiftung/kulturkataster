import { GroupsTable } from "@/components/Groups";

export default function GroupsPage() {
	return (
		<div className="max-w-5xl  mx-auto px-10">
			<div className="space-y-6">
				<GroupsTable />
			</div>
		</div>
	);
}
