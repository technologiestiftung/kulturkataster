import { UsersTable } from "@/components/Users";

export default function UsersPage() {
	return (
		<div className="mx-auto md:px-10 w-full h-full min-h-0 flex flex-col">
			<div className="space-y-6 flex-1 min-h-0 flex flex-col">
				<UsersTable />
			</div>
		</div>
	);
}
