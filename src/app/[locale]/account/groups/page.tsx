import { GroupsTable } from "@/components/Groups";

export default function GroupsPage() {
	return (
		<div className="container mx-auto p-10">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold">Group Management</h1>
					<p className="text-muted-foreground mt-2">
						Manage groups, their members, and institution access
					</p>
				</div>
				<GroupsTable />
			</div>
		</div>
	);
}
