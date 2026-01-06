"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableConfig } from "@/components/shared/DataTable";
import type { User } from "./types";
import { sampleUsers } from "./constants";
import { UserEditModal } from "./UserEditModal";
import { Badge } from "@/components/ui/badge";

export function UsersTable() {
	const [users, setUsers] = useState<User[]>(sampleUsers);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const handleEditModalOpenChange = (nextOpen: boolean) => {
		setIsEditModalOpen(nextOpen);
		if (!nextOpen) {
			setSelectedUser(null);
		}
	};

	const handleAddUser = () => {
		const newUser: User = {
			id: Date.now().toString(),
			name: "",
			email: "",
			role: "viewer",
			status: "pending",
			complianceAccepted: false,
			lastActivity: new Date(),
			access: {
				type: "inherit",
				source: "group-inherited",
				institutionCount: 0,
			},
			groups: [],
			ownershipClaims: [],
		};
		setSelectedUser(newUser);
		setIsEditModalOpen(true);
	};

	const handleEditUser = (user: User) => {
		setSelectedUser(user);
		setIsEditModalOpen(true);
	};

	const handleDeleteUser = (userId: string) => {
		setUsers(users.filter((u) => u.id !== userId));
		setIsEditModalOpen(false);
		setSelectedUser(null);
	};

	const handleSaveUser = (updatedUser: User) => {
		const exists = users.some((u) => u.id === updatedUser.id);
		if (exists) {
			setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
		} else {
			setUsers([...users, updatedUser]);
		}
		setIsEditModalOpen(false);
		setSelectedUser(null);
	};

	const handleResendEmail = (userId: string) => {
		console.log("Resend email to user:", userId);
	};

	const handleResetPassword = (userId: string) => {
		console.log("Reset password for user:", userId);
	};

	const handleResendCompliance = (userId: string) => {
		console.log("Resend compliance request to user:", userId);
	};

	const tableConfig: DataTableConfig<User> = {
		columns: [
			{
				key: "name",
				label: "Name",
				sortable: true,
				getValue: (row) => row.name,
			},
			{
				key: "email",
				label: "Email",
				sortable: true,
				getValue: (row) => row.email,
			},
			{
				key: "role",
				label: "Role",
				sortable: true,
				getValue: (row) => row.role,
				render: (row) => <span className="capitalize">{row.role}</span>,
			},
			{
				key: "groups",
				label: "Gruppen",
				sortable: true,
				compare: (a, b) => {
					if (a.groups.length !== b.groups.length) {
						return a.groups.length - b.groups.length;
					}
					if (a.groups.length > 0 && b.groups.length > 0) {
						return a.groups[0].name.localeCompare(b.groups[0].name);
					}
					return 0;
				},
				render: (row) => (
					<div className="flex flex-wrap gap-1">
						{row.groups.length > 0 ? (
							row.groups.map((group) => (
								<Badge key={group.id} variant="secondary" className="text-xs">
									{group.name}
								</Badge>
							))
						) : (
							<span className="text-muted-foreground">—</span>
						)}
					</div>
				),
			},
			{
				key: "status",
				label: "Status",
				sortable: true,
				getValue: (row) => row.status,
				render: (row) => {
					let variant: "default" | "secondary" | "outline" = "outline";
					if (row.status === "active") variant = "default";
					if (row.status === "inactive") variant = "secondary";
					return <Badge variant={variant}>{row.status}</Badge>;
				},
			},
			{
				key: "access",
				label: "Institution Access",
				sortable: true,
				compare: (a, b) =>
					a.access.institutionCount - b.access.institutionCount,
				render: (row) => (
					<div className="flex flex-col gap-1">
						<span className="text-sm">
							{row.access.institutionCount} institutions
						</span>
						<span className="text-xs text-muted-foreground capitalize">
							{row.access.type} ({row.access.source.replace(/-/g, " ")})
						</span>
					</div>
				),
			},
			{
				key: "lastActivity",
				label: "Last Activity",
				sortable: true,
				getValue: (row) => row.lastActivity,
			},
			{
				key: "compliance",
				label: "Compliance",
				sortable: true,
				compare: (a, b) =>
					Number(a.complianceAccepted) - Number(b.complianceAccepted),
				render: (row) => (
					<Badge variant={row.complianceAccepted ? "default" : "destructive"}>
						{row.complianceAccepted ? "Accepted" : "Pending"}
					</Badge>
				),
			},
		],
		data: users,
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: "Search users...",
		getSearchableValues: (row) => [
			row.name,
			row.email,
			row.role,
			row.status,
			row.access.type,
			row.access.source,
			String(row.access.institutionCount),
			row.complianceAccepted ? "compliance-accepted" : "compliance-pending",
			...row.groups.map((group) => group.name),
		],
		addButton: {
			label: "Add User",
			onClick: handleAddUser,
		},
		onEdit: handleEditUser,
		emptyMessage: "No users found.",
	};

	return (
		<>
			<DataTable config={tableConfig} />

			<UserEditModal
				user={selectedUser}
				open={isEditModalOpen}
				onOpenChange={handleEditModalOpenChange}
				onSave={handleSaveUser}
				onDelete={handleDeleteUser}
				onResendEmail={handleResendEmail}
				onResetPassword={handleResetPassword}
				onResendCompliance={handleResendCompliance}
			/>
		</>
	);
}
