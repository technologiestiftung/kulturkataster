/* eslint-disable complexity */
"use client";

import { useState, useMemo } from "react";
import {
	StickyTable,
	StickyTableBody,
	StickyTableHead,
	StickyTableHeader,
	StickyTableRow,
	StickyActionsHead,
} from "@/components/ui/sticky-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { SortableTableHead } from "@/components/shared";
import type { SortDirection } from "@/components/shared";
import type { Institution, SortColumn } from "./types";
import { sampleInstitutions } from "./constants";
import { InstitutionRow } from "./InstitutionRow";
import { InstitutionEditModal } from "./InstitutionEditModal";
import { useRouter } from "next/navigation";

export function InstitutionsTable() {
	const router = useRouter();
	const [institutions, setInstitutions] =
		useState<Institution[]>(sampleInstitutions);
	const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);
	const [selectedInstitution, setSelectedInstitution] =
		useState<Institution | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	const handleEditModalOpenChange = (nextOpen: boolean) => {
		setIsEditModalOpen(nextOpen);
		if (!nextOpen) {
			setSelectedInstitution(null);
		}
	};

	const handleSort = (column: string) => {
		const typedColumn = column as SortColumn;
		if (sortColumn === typedColumn) {
			if (sortDirection === "asc") {
				setSortDirection("desc");
			} else if (sortDirection === "desc") {
				setSortDirection(null);
				setSortColumn(null);
			}
		} else {
			setSortColumn(typedColumn);
			setSortDirection("asc");
		}
	};

	const filteredInstitutions = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		if (!term) return institutions;

		return institutions.filter((institution) => {
			const values: string[] = [
				institution.name,
				institution.slug,
				institution.type,
				institution.status,
				institution.address.city,
				institution.address.district || "",
				institution.address.street,
				institution.contact.name,
				institution.contact.email,
				institution.ownerName || "",
				institution.verified ? "verified" : "unverified",
			];

			return values.some((value) => value.toLowerCase().includes(term));
		});
	}, [institutions, searchTerm]);

	const sortedInstitutions = useMemo(() => {
		if (!sortColumn || !sortDirection) {
			return filteredInstitutions;
		}

		return [...filteredInstitutions].sort((a, b) => {
			let comparison = 0;

			switch (sortColumn) {
				case "name":
					comparison = a.name.localeCompare(b.name);
					break;
				case "type":
					comparison = a.type.localeCompare(b.type);
					break;
				case "status":
					comparison = a.status.localeCompare(b.status);
					break;
				case "city":
					comparison = a.address.city.localeCompare(b.address.city);
					break;
				case "owner":
					comparison = (a.ownerName || "").localeCompare(b.ownerName || "");
					break;
				case "verified":
					comparison = Number(a.verified) - Number(b.verified);
					break;
				case "createdAt":
					comparison = a.createdAt.getTime() - b.createdAt.getTime();
					break;
				case "updatedAt":
					comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
					break;
				default:
					comparison = 0;
			}

			return sortDirection === "asc" ? comparison : -comparison;
		});
	}, [filteredInstitutions, sortColumn, sortDirection]);

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

	return (
		<>
			<div className="space-y-4">
				<div className="flex items-center justify-between gap-4">
					<Input
						placeholder="Search institutions..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="max-w-sm"
					/>
					<Button onClick={handleAddNew}>
						<Plus className="h-4 w-4 mr-2" />
						Add Institution
					</Button>
				</div>

				<div className="rounded-md border">
					<StickyTable>
						<StickyTableHeader>
							<StickyTableRow>
								<SortableTableHead
									column="name"
									currentSortColumn={sortColumn}
									currentSortDirection={sortDirection}
									onSort={handleSort}
									HeadComponent={StickyTableHead}
								>
									Name
								</SortableTableHead>
								<SortableTableHead
									column="type"
									currentSortColumn={sortColumn}
									currentSortDirection={sortDirection}
									onSort={handleSort}
									HeadComponent={StickyTableHead}
								>
									Type
								</SortableTableHead>
								<SortableTableHead
									column="status"
									currentSortColumn={sortColumn}
									currentSortDirection={sortDirection}
									onSort={handleSort}
									HeadComponent={StickyTableHead}
								>
									Status
								</SortableTableHead>
								<SortableTableHead
									column="city"
									currentSortColumn={sortColumn}
									currentSortDirection={sortDirection}
									onSort={handleSort}
									HeadComponent={StickyTableHead}
								>
									City
								</SortableTableHead>
								<SortableTableHead
									column="owner"
									currentSortColumn={sortColumn}
									currentSortDirection={sortDirection}
									onSort={handleSort}
									HeadComponent={StickyTableHead}
								>
									Owner
								</SortableTableHead>
								<SortableTableHead
									column="verified"
									currentSortColumn={sortColumn}
									currentSortDirection={sortDirection}
									onSort={handleSort}
									HeadComponent={StickyTableHead}
								>
									Verified
								</SortableTableHead>
								<SortableTableHead
									column="createdAt"
									currentSortColumn={sortColumn}
									currentSortDirection={sortDirection}
									onSort={handleSort}
									HeadComponent={StickyTableHead}
								>
									Created
								</SortableTableHead>
								<SortableTableHead
									column="updatedAt"
									currentSortColumn={sortColumn}
									currentSortDirection={sortDirection}
									onSort={handleSort}
									HeadComponent={StickyTableHead}
								>
									Updated
								</SortableTableHead>
								<StickyActionsHead />
							</StickyTableRow>
						</StickyTableHeader>
						<StickyTableBody>
							{sortedInstitutions.length > 0 ? (
								sortedInstitutions.map((institution) => (
									<InstitutionRow
										key={institution.id}
										institution={institution}
										onEdit={handleEdit}
									/>
								))
							) : (
								<StickyTableRow>
									<StickyTableHead colSpan={9} className="h-24 text-center">
										No institutions found.
									</StickyTableHead>
								</StickyTableRow>
							)}
						</StickyTableBody>
					</StickyTable>
				</div>
			</div>

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
