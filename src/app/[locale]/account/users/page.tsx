import { UsersTable } from "@/components/Users";

export default function UsersPage() {
	return (
		<div className="mx-auto p-10">
			<div className="space-y-6">
				<UsersTable />
			</div>
		</div>
	);
}
