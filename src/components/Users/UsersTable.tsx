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
import {
	ChevronDown,
	ChevronUp,
	Plus,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	MoreVertical,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";

type AccessType = "inherit" | "custom";

interface InstitutionAccess {
	id: string;
	name: string;
}

interface UserAccessDetails {
	type: AccessType;
	source: "group-inherited" | "individual-override" | "mixed"; // Where access comes from
	customInstitutions?: InstitutionAccess[]; // Only used when type is "custom"
	institutionCount: number;
}

interface Group {
	id: string;
	name: string;
}

interface User {
	id: string;
	name: string;
	email: string;
	role:
		| "admin"
		| "editor"
		| "redaktion"
		| "contributor"
		| "publisher"
		| "viewer";
	status: "active" | "inactive" | "pending";
	lastActivity: Date;
	access: UserAccessDetails;
	groups: Group[]; // Groups the user belongs to
}

const sampleUsers: User[] = [
	{
		id: "1",
		name: "Max Mustermann",
		email: "max.mustermann@example.com",
		role: "admin",
		status: "active",
		lastActivity: new Date("2025-11-10T09:30:00"),
		access: {
			type: "inherit",
			source: "group-inherited",
			institutionCount: 234,
		},
		groups: [
			{ id: "g1", name: "Admin" },
			{ id: "g2", name: "Open Spaces" },
		],
	},
	{
		id: "2",
		name: "Anna Schmidt",
		email: "anna.schmidt@example.com",
		role: "editor",
		status: "active",
		lastActivity: new Date("2025-11-09T14:22:00"),
		access: {
			type: "custom",
			source: "mixed", // From group + additional custom institutions
			customInstitutions: [
				{ id: "15", name: "Berlinische Galerie" },
				{ id: "23", name: "C/O Berlin" },
			],
			institutionCount: 89,
		},
		groups: [{ id: "g3", name: "Custom District" }],
	},
	{
		id: "3",
		name: "Peter Mueller",
		email: "peter.mueller@example.com",
		role: "viewer",
		status: "inactive",
		lastActivity: new Date("2025-10-15T11:05:00"),
		access: {
			type: "custom",
			source: "individual-override",
			customInstitutions: [
				{ id: "5", name: "Museum für Naturkunde" },
				{ id: "12", name: "Alte Nationalgalerie" },
			],
			institutionCount: 52,
		},
		groups: [],
	},
	{
		id: "4",
		name: "Lisa Weber",
		email: "lisa.weber@example.com",
		role: "editor",
		status: "pending",
		lastActivity: new Date("2025-11-08T16:45:00"),
		access: {
			type: "custom",
			source: "individual-override",
			customInstitutions: [
				{ id: "1", name: "Berlinische Galerie" },
				{ id: "2", name: "Hamburger Bahnhof" },
				{ id: "3", name: "KW Institute for Contemporary Art" },
			],
			institutionCount: 3,
		},
		groups: [],
	},
	{
		id: "5",
		name: "Tom Fischer",
		email: "tom.fischer@example.com",
		role: "viewer",
		status: "active",
		lastActivity: new Date("2025-11-10T08:12:00"),
		access: {
			type: "custom",
			source: "individual-override",
			customInstitutions: [{ id: "20", name: "Pankow Kulturzentrum" }],
			institutionCount: 31,
		},
		groups: [],
	},
	{
		id: "6",
		name: "Sarah Koch",
		email: "sarah.koch@example.com",
		role: "publisher",
		status: "active",
		lastActivity: new Date("2025-11-10T10:15:00"),
		access: {
			type: "custom",
			source: "individual-override",
			customInstitutions: [
				{ id: "30", name: "Schaubühne" },
				{ id: "31", name: "Radialsystem" },
			],
			institutionCount: 67,
		},
		groups: [],
	},
	{
		id: "7",
		name: "Michael Becker",
		email: "michael.becker@example.com",
		role: "redaktion",
		status: "active",
		lastActivity: new Date("2025-11-09T16:30:00"),
		access: {
			type: "custom",
			source: "individual-override",
			customInstitutions: [
				{ id: "40", name: "Berghain" },
				{ id: "41", name: "Gretchen" },
			],
			institutionCount: 102,
		},
		groups: [],
	},
	{
		id: "8",
		name: "Julia Hoffmann",
		email: "julia.hoffmann@example.com",
		role: "contributor",
		status: "pending",
		lastActivity: new Date("2025-11-07T13:20:00"),
		access: {
			type: "custom",
			source: "individual-override",
			customInstitutions: [
				{ id: "10", name: "Kulturbrauerei" },
				{ id: "11", name: "Pfefferberg Theater" },
			],
			institutionCount: 2,
		},
		groups: [],
	},
	{
		id: "9",
		name: "Stefan Werner",
		email: "stefan.werner@example.com",
		role: "publisher",
		status: "active",
		lastActivity: new Date("2025-11-10T07:45:00"),
		access: {
			type: "custom",
			source: "individual-override",
			customInstitutions: [
				{ id: "50", name: "Deutsche Oper" },
				{ id: "51", name: "Staatsoper" },
			],
			institutionCount: 234,
		},
		groups: [],
	},
	{
		id: "10",
		name: "Katharina Schulz",
		email: "katharina.schulz@example.com",
		role: "redaktion",
		status: "active",
		lastActivity: new Date("2025-11-09T11:00:00"),
		access: {
			type: "custom",
			source: "individual-override",
			customInstitutions: [{ id: "60", name: "Amerika-Gedenkbibliothek" }],
			institutionCount: 48,
		},
		groups: [],
	},
	{
		id: "11",
		name: "Martin Richter",
		email: "martin.richter@example.com",
		role: "contributor",
		status: "active",
		lastActivity: new Date("2025-11-08T09:30:00"),
		access: {
			type: "custom",
			source: "individual-override",
			customInstitutions: [{ id: "70", name: "Tempodrom" }],
			institutionCount: 41,
		},
		groups: [],
	},
];

function getRoleBadgeVariant(
	role: User["role"],
): "default" | "secondary" | "outline" {
	switch (role) {
		case "admin":
			return "default";
		case "publisher":
			return "default";
		case "redaktion":
			return "secondary";
		case "editor":
			return "secondary";
		case "contributor":
			return "outline";
		case "viewer":
			return "outline";
		default:
			return "outline";
	}
}

function getStatusBadgeVariant(
	status: User["status"],
): "default" | "secondary" | "outline" {
	switch (status) {
		case "active":
			return "default";
		case "inactive":
			return "secondary";
		case "pending":
			return "outline";
		default:
			return "outline";
	}
}

function formatLastActivity(date: Date): string {
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
	const diffInDays = Math.floor(diffInHours / 24);

	if (diffInHours < 1) {
		return "Just now";
	} else if (diffInHours < 24) {
		return `${diffInHours}h ago`;
	} else if (diffInDays < 7) {
		return `${diffInDays}d ago`;
	}
	return date.toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function getRoleLabel(role: User["role"]): string {
	switch (role) {
		case "admin":
			return "Administrator";
		case "publisher":
			return "Herausgeber";
		case "redaktion":
			return "Redaktion";
		case "editor":
			return "Bearbeiter";
		case "contributor":
			return "Mitwirkender";
		case "viewer":
			return "Betrachter";
		default:
			return role;
	}
}

function getAccessLabel(access: UserAccessDetails): string {
	switch (access.type) {
		case "inherit":
			return "Von Gruppe";
		case "custom":
			return "Benutzerdefiniert";
		default:
			return "Unbekannt";
	}
}

function AccessDetailsRow({ access }: { access: UserAccessDetails }) {
	const getSourceBadge = () => {
		const sourceLabels = {
			"group-inherited": "Von Gruppe",
			"individual-override": "Individuell",
			mixed: "Gemischt",
		};

		const sourceVariants = {
			"group-inherited": "secondary",
			"individual-override": "outline",
			mixed: "default",
		} as const;

		return (
			<Badge variant={sourceVariants[access.source]} className="text-xs ml-2">
				{sourceLabels[access.source]}
			</Badge>
		);
	};

	if (access.type === "inherit") {
		return (
			<div className="text-xs text-muted-foreground mt-1 flex items-center">
				<span>Access inherited from groups</span>
				{getSourceBadge()}
			</div>
		);
	}

	if (access.type === "custom" && access.customInstitutions) {
		return (
			<div className="text-xs text-muted-foreground mt-1 flex items-center">
				<span>{access.customInstitutions.map((i) => i.name).join(", ")}</span>
				{getSourceBadge()}
			</div>
		);
	}

	return (
		<div className="text-xs text-muted-foreground mt-1 flex items-center">
			<span>Custom access configured</span>
			{getSourceBadge()}
		</div>
	);
}

type SortColumn =
	| "name"
	| "email"
	| "role"
	| "groups"
	| "status"
	| "lastActivity"
	| "access";
type SortDirection = "asc" | "desc" | null;

interface SortableTableHeadProps {
	column: SortColumn;
	currentSortColumn: SortColumn | null;
	currentSortDirection: SortDirection;
	onSort: (column: SortColumn) => void;
	children: React.ReactNode;
	className?: string;
}

function SortableTableHead({
	column,
	currentSortColumn,
	currentSortDirection,
	onSort,
	children,
	className,
}: SortableTableHeadProps) {
	const isSorted = currentSortColumn === column;

	const getSortIcon = () => {
		if (!isSorted) {
			return <ArrowUpDown className="h-4 w-4 opacity-50" />;
		}
		if (currentSortDirection === "asc") {
			return <ArrowUp className="h-4 w-4" />;
		}
		return <ArrowDown className="h-4 w-4" />;
	};

	return (
		<TableHead className={className}>
			<button
				className="flex items-center gap-2 hover:text-foreground transition-colors"
				onClick={() => onSort(column)}
			>
				{children}
				{getSortIcon()}
			</button>
		</TableHead>
	);
}

interface UserActionModalProps {
	user: User | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (user: User) => void;
	onDelete: (userId: string) => void;
}

function UserActionModal({
	user,
	open,
	onOpenChange,
	onSave,
	onDelete,
}: UserActionModalProps) {
	const [editedUser, setEditedUser] = useState<User | null>(user);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	// Update edited user when user prop changes
	React.useEffect(() => {
		setEditedUser(user);
		setShowDeleteConfirm(false);
	}, [user]);

	if (!editedUser) return null;

	const handleSave = () => {
		onSave(editedUser);
		onOpenChange(false);
	};

	const handleDelete = () => {
		onDelete(editedUser.id);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">Edit User</DialogTitle>
					<DialogDescription>
						Make changes to the user account details below.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								value={editedUser.name}
								onChange={(e) =>
									setEditedUser({ ...editedUser, name: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={editedUser.email}
								onChange={(e) =>
									setEditedUser({ ...editedUser, email: e.target.value })
								}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="role">Role</Label>
							<select
								id="role"
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								value={editedUser.role}
								onChange={(e) =>
									setEditedUser({
										...editedUser,
										role: e.target.value as User["role"],
									})
								}
							>
								<option value="admin">Administrator</option>
								<option value="publisher">Herausgeber</option>
								<option value="redaktion">Redaktion</option>
								<option value="editor">Bearbeiter</option>
								<option value="contributor">Mitwirkender</option>
								<option value="viewer">Betrachter</option>
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="status">Status</Label>
							<select
								id="status"
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								value={editedUser.status}
								onChange={(e) =>
									setEditedUser({
										...editedUser,
										status: e.target.value as User["status"],
									})
								}
							>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
								<option value="pending">Pending</option>
							</select>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Gruppen (Groups)</Label>
						<div className="p-3 bg-muted/50 rounded-md border-2 border-dashed">
							<div className="flex flex-wrap gap-2 mb-2">
								{editedUser.groups.length > 0 ? (
									editedUser.groups.map((group) => (
										<Badge key={group.id} variant="secondary">
											{group.name}
										</Badge>
									))
								) : (
									<span className="text-sm text-muted-foreground">
										No groups assigned
									</span>
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								Group management interface will go here
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="accessType">Institution Access</Label>
						<select
							id="accessType"
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							value={editedUser.access.type}
							onChange={(e) =>
								setEditedUser({
									...editedUser,
									access: {
										...editedUser.access,
										type: e.target.value as AccessType,
									},
								})
							}
						>
							<option value="inherit">
								Von Gruppe erben (Inherit from Groups)
							</option>
							<option value="custom">Benutzerdefiniert (Custom)</option>
						</select>

						{editedUser.access.type === "inherit" && (
							<div className="p-3 bg-muted/50 rounded-md text-sm">
								<p className="text-muted-foreground mb-2">
									User will inherit access from all assigned groups.
								</p>
								<p className="text-xs text-muted-foreground">
									Manage groups above to control institution access.
								</p>
							</div>
						)}

						{editedUser.access.type === "custom" && (
							<div className="space-y-2">
								<Label className="text-sm text-muted-foreground">
									Select Institutions
								</Label>
								<div className="p-3 bg-muted/50 rounded-md text-sm border-2 border-dashed">
									<p className="text-muted-foreground">
										Institution search and select will go here
									</p>
									<p className="text-xs text-muted-foreground mt-2">
										Custom institutions can be added on top of group access
										(mixed mode) or replace it entirely (individual override).
									</p>
								</div>
							</div>
						)}

						<div className="p-3 bg-muted rounded-md text-sm">
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">
									Current: {editedUser.access.institutionCount} institutions
								</span>
							</div>
							<AccessDetailsRow access={editedUser.access} />
						</div>
					</div>

					<div className="space-y-2">
						<Label>Last Activity</Label>
						<div className="p-3 bg-muted rounded-md space-y-1">
							<div className="text-sm font-medium">
								{formatLastActivity(editedUser.lastActivity)}
							</div>
							<div className="text-xs text-muted-foreground">
								{editedUser.lastActivity.toLocaleString("de-DE", {
									weekday: "long",
									year: "numeric",
									month: "long",
									day: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="flex justify-between sm:justify-between">
					<div>
						{!showDeleteConfirm ? (
							<Button
								type="button"
								variant="destructive"
								onClick={() => setShowDeleteConfirm(true)}
							>
								Delete User
							</Button>
						) : (
							<div className="flex gap-2">
								<Button
									type="button"
									variant="destructive"
									onClick={handleDelete}
								>
									Confirm Delete
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => setShowDeleteConfirm(false)}
								>
									Cancel
								</Button>
							</div>
						)}
					</div>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="button" onClick={handleSave}>
							Save Changes
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function UsersTable() {
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
	const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const toggleRow = (userId: string) => {
		setExpandedRows((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(userId)) {
				newSet.delete(userId);
			} else {
				newSet.add(userId);
			}
			return newSet;
		});
	};

	const handleSort = (column: SortColumn) => {
		if (sortColumn === column) {
			// Cycle through: asc -> desc -> null
			if (sortDirection === "asc") {
				setSortDirection("desc");
			} else if (sortDirection === "desc") {
				setSortDirection(null);
				setSortColumn(null);
			}
		} else {
			setSortColumn(column);
			setSortDirection("asc");
		}
	};

	const sortedUsers = useMemo(() => {
		if (!sortColumn || !sortDirection) {
			return sampleUsers;
		}

		return [...sampleUsers].sort((a, b) => {
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
					// Sort by number of groups, then by first group name
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
	}, [sortColumn, sortDirection]);

	const handleAddUser = () => {
		console.log("Add user clicked");
		// TODO: Implement add user functionality
	};

	const handleEditUser = (user: User) => {
		setSelectedUser(user);
		setIsEditModalOpen(true);
	};

	const handleDeleteUser = (userId: string) => {
		console.log("Delete user:", userId);
		// TODO: Implement delete user functionality
	};

	const handleSaveUser = (updatedUser: User) => {
		console.log("Save user:", updatedUser);
		// TODO: Implement save user functionality
	};

	const handleResendEmail = (userId: string) => {
		console.log("Resend email to user:", userId);
		// TODO: Implement resend email functionality
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
					{sortedUsers.map((user) => {
						const isExpanded = expandedRows.has(user.id);
						return (
							<>
								<TableRow key={user.id}>
									<TableCell>
										<button
											onClick={() => toggleRow(user.id)}
											className="hover:bg-muted p-1 rounded"
											aria-label={isExpanded ? "Collapse row" : "Expand row"}
										>
											{isExpanded ? (
												<ChevronUp className="h-4 w-4" />
											) : (
												<ChevronDown className="h-4 w-4" />
											)}
										</button>
									</TableCell>
									<TableCell className="font-medium">{user.name}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										<Badge variant={getRoleBadgeVariant(user.role)}>
											{getRoleLabel(user.role)}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{user.groups.length > 0 ? (
												user.groups.map((group) => (
													<Badge
														key={group.id}
														variant="secondary"
														className="text-xs"
													>
														{group.name}
													</Badge>
												))
											) : (
												<span className="text-sm text-muted-foreground">-</span>
											)}
										</div>
									</TableCell>
									<TableCell>
										<Badge variant={getStatusBadgeVariant(user.status)}>
											{user.status}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Badge variant="outline">
												{getAccessLabel(user.access)}
											</Badge>
											<span className="text-sm text-muted-foreground">
												({user.access.institutionCount})
											</span>
										</div>
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{formatLastActivity(user.lastActivity)}
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													<MoreVertical className="h-4 w-4" />
													<span className="sr-only">Open menu</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => handleEditUser(user)}>
													Edit User
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleResendEmail(user.id)}
												>
													Resend Email
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
								{isExpanded && (
									<TableRow key={`${user.id}-details`}>
										<TableCell></TableCell>
										<TableCell colSpan={8}>
											<div className="py-2">
												<div className="text-sm font-medium mb-1">
													Access Details:
												</div>
												<AccessDetailsRow access={user.access} />
											</div>
										</TableCell>
									</TableRow>
								)}
							</>
						);
					})}
				</TableBody>
			</Table>

			<UserActionModal
				user={selectedUser}
				open={isEditModalOpen}
				onOpenChange={setIsEditModalOpen}
				onSave={handleSaveUser}
				onDelete={handleDeleteUser}
			/>
		</div>
	);
}
