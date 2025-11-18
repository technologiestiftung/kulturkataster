/* eslint-disable complexity */
"use client";

import { useState } from "react";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Role } from "./types";
import { sampleRoles } from "./constants";
import { createFieldPermissions } from "./utils";
import { RoleRow } from "./RoleRow";
import { RoleEditModal } from "./RoleEditModal";

export function RolesTable() {
	const [roles, setRoles] = useState<Role[]>(sampleRoles);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editedRole, setEditedRole] = useState<Role | null>(null);

	const handleEditRole = (role: Role) => {
		setEditedRole({ ...role });
		setIsEditModalOpen(true);
	};

	const handleSaveRole = (role: Role) => {
		const exists = roles.some((r) => r.id === role.id);
		if (exists) {
			// Update existing role
			setRoles(roles.map((r) => (r.id === role.id ? role : r)));
		} else {
			// Add new role
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

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold">Roles</h2>
					<p className="text-muted-foreground">
						{roles.length} {roles.length === 1 ? "role" : "roles"} total
					</p>
				</div>
				<Button onClick={handleAddRole}>
					<Plus className="h-4 w-4 mr-2" />
					Create Role
				</Button>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Permissions</TableHead>
							<TableHead>Users</TableHead>
							<TableHead className="w-[100px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{roles.map((role) => (
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
