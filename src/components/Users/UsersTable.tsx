/* eslint-disable complexity */
"use client";

import { useState, useMemo } from "react";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SortableTableHead } from "@/components/shared";
import type { SortDirection } from "@/components/shared";
import type { User, SortColumn } from "./types";
import { sampleUsers } from "./constants";
import { UserRow } from "./UserRow";
import { UserEditModal } from "./UserEditModal";

export function UsersTable() {
	const [users, setUsers] = useState<User[]>(sampleUsers);
	const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const handleEditModalOpenChange = (nextOpen: boolean) => {
		setIsEditModalOpen(nextOpen);
		if (!nextOpen) {
			setSelectedUser(null);
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

	const sortedUsers = useMemo(() => {
		if (!sortColumn || !sortDirection) {
			return users;
		}

		return [...users].sort((a, b) => {
			let comparison = 0;

			switch (sortColumn) {
				case "name":
					comparison = a.name.localeCompare(b.name);
					break;
				case "email":
					comparison = a.email.localeCompare(b.email);
					break;
				case "role":
					comparison = a.role.localeCompare(b.role);
					break;
				case "groups":
					if (a.groups.length !== b.groups.length) {
						comparison = a.groups.length - b.groups.length;
					} else if (a.groups.length > 0 && b.groups.length > 0) {
						comparison = a.groups[0].name.localeCompare(b.groups[0].name);
					} else {
						comparison = 0;
					}
					break;
				case "status":
					comparison = a.status.localeCompare(b.status);
					break;
				case "lastActivity":
					comparison = a.lastActivity.getTime() - b.lastActivity.getTime();
					break;
				case "access":
					comparison = a.access.institutionCount - b.access.institutionCount;
					break;
				default:
					comparison = 0;
					break;
			}

			return sortDirection === "asc" ? comparison : -comparison;
		});
	}, [users, sortColumn, sortDirection]);

	const handleAddUser = () => {
		const newUser: User = {
			id: Date.now().toString(),
			name: "",
			email: "",
			role: "viewer",
			status: "pending",
			lastActivity: new Date(),
			access: {
				type: "inherit",
				source: "group-inherited",
				institutionCount: 0,
			},
			groups: [],
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
			// Update existing user
			setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
		} else {
			// Add new user
			setUsers([...users, updatedUser]);
		}
		setIsEditModalOpen(false);
		setSelectedUser(null);
	};

	const handleResendEmail = (userId: string) => {
		console.log("Resend email to user:", userId);
	};

	return (
		<div className="w-full space-y-4">
			<div className="flex justify-end">
				<Button onClick={handleAddUser}>
					<Plus className="mr-2 h-4 w-4" />
					Add User
				</Button>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[50px]"></TableHead>
						<SortableTableHead
							column="name"
							currentSortColumn={sortColumn}
							currentSortDirection={sortDirection}
							onSort={handleSort}
						>
							Name
						</SortableTableHead>
						<SortableTableHead
							column="email"
							currentSortColumn={sortColumn}
							currentSortDirection={sortDirection}
							onSort={handleSort}
						>
							Email
						</SortableTableHead>
						<SortableTableHead
							column="role"
							currentSortColumn={sortColumn}
							currentSortDirection={sortDirection}
							onSort={handleSort}
						>
							Role
						</SortableTableHead>
						<SortableTableHead
							column="groups"
							currentSortColumn={sortColumn}
							currentSortDirection={sortDirection}
							onSort={handleSort}
						>
							Gruppen
						</SortableTableHead>
						<SortableTableHead
							column="status"
							currentSortColumn={sortColumn}
							currentSortDirection={sortDirection}
							onSort={handleSort}
						>
							Status
						</SortableTableHead>
						<SortableTableHead
							column="access"
							currentSortColumn={sortColumn}
							currentSortDirection={sortDirection}
							onSort={handleSort}
						>
							Institution Access
						</SortableTableHead>
						<SortableTableHead
							column="lastActivity"
							currentSortColumn={sortColumn}
							currentSortDirection={sortDirection}
							onSort={handleSort}
						>
							Last Activity
						</SortableTableHead>
						<TableHead className="w-[120px]">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sortedUsers.map((user) => (
						<UserRow
							key={user.id}
							user={user}
							onEdit={handleEditUser}
							onResendEmail={handleResendEmail}
						/>
					))}
				</TableBody>
			</Table>

			<UserEditModal
				user={selectedUser}
				open={isEditModalOpen}
				onOpenChange={handleEditModalOpenChange}
				onSave={handleSaveUser}
				onDelete={handleDeleteUser}
			/>
		</div>
	);
}
