"use client";

import { useMemo, useState } from "react";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import type { Role } from "./types";
import { sampleRoles } from "./constants";
import { createFieldPermissions, getPermissionSummary } from "./utils";
import { RoleRow } from "./RoleRow";
import { RoleEditModal } from "./RoleEditModal";

export function RolesTable() {
	const [roles, setRoles] = useState<Role[]>(sampleRoles);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editedRole, setEditedRole] = useState<Role | null>(null);
	const [searchTerm, setSearchTerm] = useState("");

	const handleEditRole = (role: Role) => {
		setEditedRole({ ...role });
		setIsEditModalOpen(true);
	};

	const handleSaveRole = (role: Role) => {
		const exists = roles.some((r) => r.id === role.id);
		if (exists) {
			setRoles(roles.map((r) => (r.id === role.id ? role : r)));
		} else {
			setRoles([...roles, role]);
		}
		setIsEditModalOpen(false);
		setEditedRole(null);
	};

	const handleAddRole = () => {
		const newRole: Role = {
			id: Date.now().toString(),
			name: "",
			description: "",
			permissions: {
				fields: createFieldPermissions(true, false, false),
				createInstitution: false,
				publishInstitution: false,
				changeStatus: false,
				deleteInstitution: false,
				manageUsers: false,
				manageGroups: false,
			},
			scopeRestriction: false,
			userCount: 0,
			createdAt: new Date(),
		};
		setEditedRole(newRole);
		setIsEditModalOpen(true);
	};

	const filteredRoles = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		if (!term) return roles;

		return roles.filter((role) => {
			const values: string[] = [
				role.name,
				role.description,
				getPermissionSummary(role.permissions, role.scopeRestriction),
				String(role.userCount),
			];

			if (role.isSystemRole) {
				values.push("system");
			}

			return values.some((value) => value.toLowerCase().includes(term));
		});
	}, [roles, searchTerm]);

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-2xl font-bold">Roles</h2>
					<p className="text-muted-foreground">
						{roles.length} {roles.length === 1 ? "role" : "roles"} total
					</p>
				</div>
				<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
					<Input
						placeholder="Search roles..."
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						className="w-full sm:max-w-xs"
					/>
					<Button onClick={handleAddRole} className="w-full sm:w-auto">
						<Plus className="h-4 w-4 mr-2" />
						Create Role
					</Button>
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Permissions</TableHead>
							<TableHead>Users</TableHead>
							<TableHead className="w-[120px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredRoles.map((role) => (
							<RoleRow key={role.id} role={role} onEdit={handleEditRole} />
						))}
					</TableBody>
				</Table>
			</div>

			<RoleEditModal
				role={editedRole}
				open={isEditModalOpen}
				onOpenChange={setIsEditModalOpen}
				onSave={handleSaveRole}
			/>
		</div>
	);
}
