"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableConfig } from "@/components/shared/DataTable";
import type { Institution } from "./types";
import { sampleInstitutions } from "./constants";
import { InstitutionEditModal } from "./InstitutionEditModal";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

export function InstitutionsTable() {
	const router = useRouter();
	const [institutions, setInstitutions] =
		useState<Institution[]>(sampleInstitutions);
	const [selectedInstitution, setSelectedInstitution] =
		useState<Institution | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const handleEditModalOpenChange = (nextOpen: boolean) => {
		setIsEditModalOpen(nextOpen);
		if (!nextOpen) {
			setSelectedInstitution(null);
		}
	};

	const handleEdit = (institution: Institution) => {
		setSelectedInstitution(institution);
		setIsEditModalOpen(true);
	};

	const handleSave = (updatedInstitution: Institution) => {
		setInstitutions((prev) =>
			prev.map((inst) =>
				inst.id === updatedInstitution.id ? updatedInstitution : inst,
			),
		);
	};

	const handleDelete = (institutionId: string) => {
		setInstitutions((prev) => prev.filter((inst) => inst.id !== institutionId));
	};

	const handleAddNew = () => {
		router.push("/create");
	};

	const tableConfig: DataTableConfig<Institution> = {
		columns: [
			{
				key: "name",
				label: "Name",
				sortable: true,
				getValue: (row) => row.name,
			},
			{
				key: "type",
				label: "Type",
				sortable: true,
				getValue: (row) => row.type,
				render: (row) => <span className="capitalize">{row.type}</span>,
			},
			{
				key: "status",
				label: "Status",
				sortable: true,
				getValue: (row) => row.status,
				render: (row) => {
					let variant: "default" | "secondary" | "outline" = "default";
					if (row.status === "inactive") variant = "secondary";
					if (row.status === "pending") variant = "outline";
					return <Badge variant={variant}>{row.status}</Badge>;
				},
			},
			{
				key: "city",
				label: "City",
				sortable: true,
				accessor: "address.city",
			},
			{
				key: "owner",
				label: "Owner",
				sortable: true,
				getValue: (row) => row.ownerName || "",
				render: (row) =>
					row.ownerName || <span className="text-muted-foreground">—</span>,
			},
			{
				key: "verified",
				label: "Verified",
				sortable: true,
				compare: (a, b) => Number(a.verified) - Number(b.verified),
				render: (row) => (
					<div className="flex items-center gap-2">
						{row.verified ? (
							<Check className="h-4 w-4 text-green-600" />
						) : (
							<X className="h-4 w-4 text-red-600" />
						)}
						<span className="text-sm">{row.verified ? "Yes" : "No"}</span>
					</div>
				),
			},
			{
				key: "createdAt",
				label: "Created",
				sortable: true,
				getValue: (row) => row.createdAt,
			},
			{
				key: "updatedAt",
				label: "Updated",
				sortable: true,
				getValue: (row) => row.updatedAt,
			},
		],
		data: institutions,
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: "Search institutions...",
		getSearchableValues: (row) => [
			row.name,
			row.slug,
			row.type,
			row.status,
			row.address.city,
			row.address.district || "",
			row.address.street,
			row.contact.name,
			row.contact.email,
			row.ownerName || "",
			row.verified ? "verified" : "unverified",
		],
		addButton: {
			label: "Add Institution",
			onClick: handleAddNew,
		},
		onEdit: handleEdit,
		emptyMessage: "No institutions found.",
	};

	return (
		<>
			<DataTable config={tableConfig} />

			<InstitutionEditModal
				institution={selectedInstitution}
				open={isEditModalOpen}
				onOpenChange={handleEditModalOpenChange}
				onSave={handleSave}
				onDelete={handleDelete}
			/>
		</>
	);
}
