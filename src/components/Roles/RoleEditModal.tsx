"use client";

import * as React from "react";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Role, RolePermissions, FieldCluster } from "./types";
import { FieldPermissionsTable } from "./FieldPermissionsTable";

interface RoleEditModalProps {
	role: Role | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (role: Role) => void;
}

export function RoleEditModal({
	role,
	open,
	onOpenChange,
	onSave,
}: RoleEditModalProps) {
	const [editedRole, setEditedRole] = useState<Role | null>(role);

	React.useEffect(() => {
		setEditedRole(role);
	}, [role]);

	if (!editedRole) return null;

	const isSystemAdmin = Boolean(
		editedRole.isSystemRole && editedRole.name.trim().toLowerCase() === "admin",
	);

	const handleSave = () => {
		const sanitizedRole = {
			...editedRole,
			permissions: {
				...editedRole.permissions,
				manageUsers: isSystemAdmin,
				manageGroups: isSystemAdmin,
			},
			scopeRestriction: true,
		};

		onSave(sanitizedRole);
		onOpenChange(false);
	};

	const togglePermission = (
		permission: keyof Omit<RolePermissions, "fields">,
	) => {
		if (isSystemAdmin) return;

		setEditedRole({
			...editedRole,
			permissions: {
				...editedRole.permissions,
				[permission]: !editedRole.permissions[permission],
			},
		});
	};

	const toggleFieldPermission = (
		field: FieldCluster,
		type: "view" | "requestChange" | "approveChange",
	) => {
		setEditedRole({
			...editedRole,
			permissions: {
				...editedRole.permissions,
				fields: {
					...editedRole.permissions.fields,
					[field]: {
						...editedRole.permissions.fields[field],
						[type]: !editedRole.permissions.fields[field][type],
					},
				},
			},
		});
	};

	const setAllFieldsPermission = (
		type: "view" | "requestChange" | "approveChange",
		value: boolean,
	) => {
		const newFields = { ...editedRole.permissions.fields };
		Object.keys(newFields).forEach((field) => {
			newFields[field as FieldCluster] = {
				...newFields[field as FieldCluster],
				[type]: value,
			};
		});
		setEditedRole({
			...editedRole,
			permissions: {
				...editedRole.permissions,
				fields: newFields,
			},
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent variant="entityEdit" className="max-w-4xl">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">Edit Role</DialogTitle>
					<DialogDescription>
						Configure permissions for this role
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							value={editedRole.name}
							onChange={(e) =>
								setEditedRole({ ...editedRole, name: e.target.value })
							}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Input
							id="description"
							value={editedRole.description}
							onChange={(e) =>
								setEditedRole({
									...editedRole,
									description: e.target.value,
								})
							}
						/>
					</div>

					{/* Content Permissions */}
					<div className="space-y-3 rounded-xs p-4 bg-muted/50">
						<Label className="text-base font-semibold">
							Institutionsberechtigungen
						</Label>
						<div className="grid grid-cols-2 gap-3">
							<div className="flex items-center space-x-2">
								<Checkbox
									id="createInstitution"
									checked={editedRole.permissions.createInstitution}
									disabled={isSystemAdmin}
									onCheckedChange={() => togglePermission("createInstitution")}
								/>
								<label htmlFor="createInstitution" className="text-sm">
									Erstellen
								</label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id="publishInstitution"
									checked={editedRole.permissions.publishInstitution}
									disabled={isSystemAdmin}
									onCheckedChange={() => togglePermission("publishInstitution")}
								/>
								<label htmlFor="publishInstitution" className="text-sm">
									Veröffentlichen
								</label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id="changeStatus"
									checked={editedRole.permissions.changeStatus}
									disabled={isSystemAdmin}
									onCheckedChange={() => togglePermission("changeStatus")}
								/>
								<label htmlFor="changeStatus" className="text-sm">
									Statusänderung
								</label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id="deleteInstitution"
									checked={editedRole.permissions.deleteInstitution}
									disabled={isSystemAdmin}
									onCheckedChange={() => togglePermission("deleteInstitution")}
								/>
								<label htmlFor="deleteInstitution" className="text-sm">
									Löschen
								</label>
							</div>
						</div>
					</div>

					{/* Field Permissions */}
					<FieldPermissionsTable
						permissions={editedRole.permissions.fields}
						onToggleField={toggleFieldPermission}
						onSetAllFields={setAllFieldsPermission}
						readOnly={isSystemAdmin}
					/>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave}>Save Changes</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
