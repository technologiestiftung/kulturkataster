import { InstitutionsTable } from "@/components/Institutions";

export default function InstitutionsPage() {
	return (
		<div className="container mx-auto p-10">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold">Institution Management</h1>
					<p className="text-muted-foreground mt-2">
						Manage cultural institutions and their details
					</p>
				</div>
				<InstitutionsTable />
			</div>
		</div>
	);
}
