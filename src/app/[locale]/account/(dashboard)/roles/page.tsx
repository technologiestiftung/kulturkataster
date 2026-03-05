import { RolesTable } from "@/components/Roles";

export default function RolesPage() {
	return (
		<div className="mx-auto md:px-10 w-full h-full min-h-0 flex flex-col">
			<div className="flex-1 min-h-0 flex flex-col">
				<RolesTable />
			</div>
		</div>
	);
}
