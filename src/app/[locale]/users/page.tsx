import { UsersTable } from "@/components/Users";

export default function DemoPage() {
	return (
		<div className="container mx-auto py-10">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold">User Management</h1>
					<p className="text-muted-foreground mt-2">
						Manage users and their roles
					</p>
				</div>
				<UsersTable />
			</div>
		</div>
	);
}
