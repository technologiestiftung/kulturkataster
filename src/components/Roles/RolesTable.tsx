/* eslint-disable complexity */
"use client";

import * as React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Pencil } from "lucide-react";
import { useState } from "react";

// Institution field names
const INSTITUTION_FIELDS = [
	"name",
	"categories",
	"district",
	"parent_organizations",
	"cultural_areas",
	"subcategories",
	"rooms_count",
	"support_type",
	"source",
	"cultural_area",
	"owner",
	"funding_type",
	"closing_reason",
	"created_at",
	"updated_at",
	"city",
	"address",
	"postal_code",
	"email",
	"phone",
	"website",
	"description",
	"opening_hours",
	"accessibility",
	"notes",
] as const;

type InstitutionField = (typeof INSTITUTION_FIELDS)[number];

// Per-field permissions
interface FieldPermissions {
	view: boolean;
	requestChange: boolean; // Can request changes
	approveChange: boolean; // Can approve/make changes
}

// Field permissions map
type FieldPermissionsMap = {
	[K in InstitutionField]: FieldPermissions;
};

interface RolePermissions {
	// Field-level permissions
	fields: FieldPermissionsMap;

	// Entity-level permissions
	createInstitution: boolean; // Create institution
	publishInstitution: boolean; // Publish institution
	changeStatus: boolean; // Change institution status (archive, unarchive, request deletion)
	deleteInstitution: boolean; // Delete institution (permanent deletion + approve requests)

	// Management
	manageUsers: boolean; // Manage users
	manageGroups: boolean; // Manage groups
}

interface Role {
	id: string;
	name: string;
	description: string;
	permissions: RolePermissions;
	scopeRestriction: boolean; // Can only manage users/groups they belong to
	userCount: number;
	createdAt: Date;
	isSystemRole?: boolean; // Cannot be deleted
}

// Helper to create field permissions
const createFieldPermissions = (
	view: boolean,
	requestChange: boolean,
	approveChange: boolean,
): FieldPermissionsMap => {
	return INSTITUTION_FIELDS.reduce((acc, field) => {
		acc[field] = { view, requestChange, approveChange };
		return acc;
	}, {} as FieldPermissionsMap);
};

// Sample roles data
const sampleRoles: Role[] = [
	{
		id: "1",
		name: "Admin",
		description: "Full system access with no restrictions",
		userCount: 2,
		createdAt: new Date("2025-01-15"),
		isSystemRole: true,
		permissions: {
			fields: createFieldPermissions(true, true, true), // Can view, request, and approve
			createInstitution: true,
			publishInstitution: true,
			changeStatus: true,
			deleteInstitution: true,
			manageUsers: true,
			manageGroups: true,
		},
		scopeRestriction: false,
	},
	{
		id: "2",
		name: "Redaktion",
		description: "Can approve changes and publish institution content",
		userCount: 5,
		createdAt: new Date("2025-01-20"),
		permissions: {
			fields: createFieldPermissions(true, false, true), // Can view and approve, not request
			createInstitution: true,
			publishInstitution: true,
			changeStatus: true,
			deleteInstitution: true,
			manageUsers: false,
			manageGroups: false,
		},
		scopeRestriction: false,
	},
	{
		id: "3",
		name: "Editor",
		description: "Can request changes to institution content",
		userCount: 8,
		createdAt: new Date("2025-01-25"),
		permissions: {
			fields: createFieldPermissions(true, true, false), // Can view and request, not approve
			createInstitution: false,
			publishInstitution: false,
			changeStatus: true,
			deleteInstitution: false,
			manageUsers: false,
			manageGroups: false,
		},
		scopeRestriction: false,
	},
	{
		id: "4",
		name: "Department Manager",
		description: "Can manage users and groups within their department",
		userCount: 3,
		createdAt: new Date("2025-02-01"),
		permissions: {
			fields: createFieldPermissions(true, true, true), // Full field access
			createInstitution: false,
			publishInstitution: false,
			changeStatus: true,
			deleteInstitution: true,
			manageUsers: true,
			manageGroups: true,
		},
		scopeRestriction: true, // Restricted to own group
	},
	{
		id: "5",
		name: "Guest",
		description: "Read-only access to institutions",
		userCount: 25,
		createdAt: new Date("2025-02-10"),
		isSystemRole: true,
		permissions: {
			fields: createFieldPermissions(true, false, false), // View only
			createInstitution: false,
			publishInstitution: false,
			changeStatus: false,
			deleteInstitution: false,
			manageUsers: false,
			manageGroups: false,
		},
		scopeRestriction: false,
	},
];

function getPermissionSummary(
	permissions: RolePermissions,
	scopeRestriction: boolean,
): string {
	const parts: string[] = [];

	// Field permissions summary
	const fieldValues = Object.values(permissions.fields);
	const viewableFields = fieldValues.filter((f) => f.view).length;
	const requestChangeFields = fieldValues.filter((f) => f.requestChange).length;
	const approveChangeFields = fieldValues.filter((f) => f.approveChange).length;
	const totalFields = INSTITUTION_FIELDS.length;

	if (approveChangeFields === totalFields) {
		parts.push("Alle Felder ändern & freigeben");
	} else if (approveChangeFields > 0) {
		parts.push(
			`${approveChangeFields}/${totalFields} Felder ändern & freigeben`,
		);
	} else if (requestChangeFields > 0) {
		parts.push(`${requestChangeFields}/${totalFields} Felder vorschlagen`);
	} else if (viewableFields > 0) {
		parts.push(`${viewableFields}/${totalFields} Felder ansehen`);
	}

	// Entity permissions
	const entityPerms: string[] = [];
	if (permissions.createInstitution) entityPerms.push("Erstellen");
	if (permissions.publishInstitution) entityPerms.push("Veröffentlichen");
	if (permissions.changeStatus) entityPerms.push("Statusänderung");
	if (permissions.deleteInstitution) entityPerms.push("Löschen");

	if (entityPerms.length > 0) {
		parts.push(entityPerms.join(", "));
	}

	// Management permissions
	const mgmtPerms: string[] = [];
	if (permissions.manageUsers) mgmtPerms.push("Benutzer");
	if (permissions.manageGroups) mgmtPerms.push("Gruppen");

	if (mgmtPerms.length > 0) {
		parts.push(`Verwalten: ${mgmtPerms.join(" & ")}`);
	}

	// Scope restriction
	if (scopeRestriction) {
		parts.push("Nur eigene Gruppe");
	}

	return parts.join(" | ");
}

export function RolesTable() {
	const [roles, setRoles] = useState<Role[]>(sampleRoles);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editedRole, setEditedRole] = useState<Role | null>(null);

	const handleEditRole = (role: Role) => {
		setEditedRole({ ...role });
		setIsEditModalOpen(true);
	};

	const handleSaveRole = () => {
		if (editedRole) {
			setRoles(roles.map((r) => (r.id === editedRole.id ? editedRole : r)));
			setIsEditModalOpen(false);
			setEditedRole(null);
		}
	};

	const handleAddRole = () => {
		const newRole: Role = {
			id: Date.now().toString(),
			name: "Neue Rolle",
			description: "Beschreibung",
			permissions: {
				fields: createFieldPermissions(true, false, false), // View only by default
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
		setRoles([...roles, newRole]);
		handleEditRole(newRole);
	};

	const togglePermission = (
		permission: keyof Omit<RolePermissions, "fields">,
	) => {
		if (editedRole) {
			const newValue = !editedRole.permissions[permission];
			const scopeRelevantPermissions = [
				"manageUsers",
				"manageGroups",
				"createInstitution",
				"changeStatus",
				"deleteInstitution",
				"publishInstitution",
			];

			// Check if this is the first scope-relevant permission being enabled
			const isFirstScopePermission =
				scopeRelevantPermissions.includes(permission) &&
				newValue &&
				!scopeRelevantPermissions.some(
					(p) =>
						p !== permission &&
						editedRole.permissions[p as keyof Omit<RolePermissions, "fields">],
				);

			setEditedRole({
				...editedRole,
				permissions: {
					...editedRole.permissions,
					[permission]: newValue,
				},
				// Auto-enable scopeRestriction when first relevant permission is toggled on
				scopeRestriction: isFirstScopePermission
					? true
					: editedRole.scopeRestriction,
			});
		}
	};

	const toggleFieldPermission = (
		field: InstitutionField,
		type: "view" | "requestChange" | "approveChange",
	) => {
		if (editedRole) {
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
		}
	};

	const setAllFieldsPermission = (
		type: "view" | "requestChange" | "approveChange",
		value: boolean,
	) => {
		if (editedRole) {
			const newFields = { ...editedRole.permissions.fields };
			INSTITUTION_FIELDS.forEach((field) => {
				newFields[field] = {
					...newFields[field],
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
		}
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
							<TableRow key={role.id}>
								<TableCell className="font-medium">
									{role.name}
									{role.isSystemRole && (
										<Badge variant="outline" className="ml-2 text-xs">
											System
										</Badge>
									)}
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{role.description}
								</TableCell>
								<TableCell className="text-sm">
									{getPermissionSummary(
										role.permissions,
										role.scopeRestriction,
									)}
								</TableCell>
								<TableCell>
									<Badge variant="secondary">{role.userCount}</Badge>
								</TableCell>
								<TableCell>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleEditRole(role)}
									>
										<Pencil className="h-4 w-4" />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Edit Role Modal */}
			<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
				<DialogContent className="!max-w-4xl max-h-[90vh]  overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-2xl font-bold">Edit Role</DialogTitle>
						<DialogDescription>
							Configure permissions for this role
						</DialogDescription>
					</DialogHeader>

					{editedRole && (
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
											onCheckedChange={() =>
												togglePermission("createInstitution")
											}
										/>
										<label htmlFor="createInstitution" className="text-sm">
											Erstellen
										</label>
									</div>
									<div className="flex items-center space-x-2">
										<Checkbox
											id="publishInstitution"
											checked={editedRole.permissions.publishInstitution}
											onCheckedChange={() =>
												togglePermission("publishInstitution")
											}
										/>
										<label htmlFor="publishInstitution" className="text-sm">
											Veröffentlichen
										</label>
									</div>
									<div className="flex items-center space-x-2">
										<Checkbox
											id="changeStatus"
											checked={editedRole.permissions.changeStatus}
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
											onCheckedChange={() =>
												togglePermission("deleteInstitution")
											}
										/>
										<label htmlFor="deleteInstitution" className="text-sm">
											Löschen
										</label>
									</div>
								</div>
							</div>

							{/* Management Permissions */}
							<div className="space-y-3 rounded-xs p-4 bg-muted/50">
								<Label className="text-base font-semibold">
									Verwaltungsberechtigungen
								</Label>
								<div className="grid grid-cols-2 gap-3">
									<div className="flex items-center space-x-2">
										<Checkbox
											id="manageUsers"
											checked={editedRole.permissions.manageUsers}
											onCheckedChange={() => togglePermission("manageUsers")}
										/>
										<label htmlFor="manageUsers" className="text-sm">
											Benutzer verwalten
										</label>
									</div>
									<div className="flex items-center space-x-2">
										<Checkbox
											id="manageGroups"
											checked={editedRole.permissions.manageGroups}
											onCheckedChange={() => togglePermission("manageGroups")}
										/>
										<label htmlFor="manageGroups" className="text-sm">
											Gruppen verwalten
										</label>
									</div>
								</div>
							</div>

							{/* Scope Restriction */}
							{(editedRole.permissions.manageUsers ||
								editedRole.permissions.manageGroups ||
								editedRole.permissions.createInstitution ||
								editedRole.permissions.changeStatus ||
								editedRole.permissions.deleteInstitution ||
								editedRole.permissions.publishInstitution) && (
								<div className="space-y-3 rounded-xs p-4 bg-muted/50">
									<div className="flex items-center space-x-2">
										<Checkbox
											id="scopeRestriction"
											checked={editedRole.scopeRestriction}
											onCheckedChange={() =>
												setEditedRole({
													...editedRole,
													scopeRestriction: !editedRole.scopeRestriction,
												})
											}
										/>
										<label htmlFor="scopeRestriction" className="text-sm">
											<strong>Nur eigene Gruppe</strong> - Beschränkt alle
											Berechtigungen auf die eigene(n) Gruppe(n)
										</label>
									</div>
									<p className="text-xs text-muted-foreground ml-6">
										Wenn aktiviert, können Benutzer mit dieser Rolle nur
										Benutzer, Gruppen und Institutionen innerhalb ihrer
										zugewiesenen Gruppe(n) verwalten.
									</p>
								</div>
							)}

							{/* Field Permissions */}
							<div className="space-y-3 rounded-xs p-4 bg-muted/50">
								<Label className="text-base font-semibold">
									Feldberechtigungen
								</Label>
								<div className="flex gap-4 mb-3">
									<div className="flex items-center space-x-2">
										<Checkbox
											id="selectAllView"
											checked={Object.values(
												editedRole.permissions.fields,
											).every((f) => f.view)}
											onCheckedChange={(checked) =>
												setAllFieldsPermission("view", checked === true)
											}
										/>
										<label
											htmlFor="selectAllView"
											className="text-sm font-medium"
										>
											Alle ansehen
										</label>
									</div>
									<div className="flex items-center space-x-2">
										<Checkbox
											id="selectAllRequestChange"
											checked={Object.values(
												editedRole.permissions.fields,
											).every((f) => f.requestChange)}
											onCheckedChange={(checked) =>
												setAllFieldsPermission(
													"requestChange",
													checked === true,
												)
											}
										/>
										<label
											htmlFor="selectAllRequestChange"
											className="text-sm font-medium"
										>
											Alle Änderung vorschlagen
										</label>
									</div>
									<div className="flex items-center space-x-2">
										<Checkbox
											id="selectAllApproveChange"
											checked={Object.values(
												editedRole.permissions.fields,
											).every((f) => f.approveChange)}
											onCheckedChange={(checked) =>
												setAllFieldsPermission(
													"approveChange",
													checked === true,
												)
											}
										/>
										<label
											htmlFor="selectAllApproveChange"
											className="text-sm font-medium"
										>
											Alle Ändern & Freigeben
										</label>
									</div>
								</div>
								<div className="max-h-64 overflow-y-auto border rounded-md">
									<Table>
										<TableHeader className="sticky top-0 bg-background">
											<TableRow>
												<TableHead className="w-[180px]">Feld</TableHead>
												<TableHead className="w-[100px] text-center">
													Ansehen
												</TableHead>
												<TableHead className="w-[150px] text-center">
													Änderung vorschlagen
												</TableHead>
												<TableHead className="w-[150px] text-center">
													Ändern & Freigeben
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{INSTITUTION_FIELDS.map((field) => (
												<TableRow key={field}>
													<TableCell className="font-mono text-xs">
														{field}
													</TableCell>
													<TableCell className="text-center">
														<Checkbox
															checked={
																editedRole.permissions.fields[field].view
															}
															onCheckedChange={() =>
																toggleFieldPermission(field, "view")
															}
														/>
													</TableCell>
													<TableCell className="text-center">
														<Checkbox
															checked={
																editedRole.permissions.fields[field]
																	.requestChange
															}
															onCheckedChange={() =>
																toggleFieldPermission(field, "requestChange")
															}
														/>
													</TableCell>
													<TableCell className="text-center">
														<Checkbox
															checked={
																editedRole.permissions.fields[field]
																	.approveChange
															}
															onCheckedChange={() =>
																toggleFieldPermission(field, "approveChange")
															}
														/>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSaveRole}>Save Changes</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
