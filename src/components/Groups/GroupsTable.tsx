"use client";

import { useState } from "react";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreVertical, Plus } from "lucide-react";

type InstitutionAccessType = "all" | "district" | "category" | "custom";

interface DistrictAccess {
	key: string;
	name: string;
}

interface CategoryAccess {
	key: string;
	name: string;
}

interface InstitutionAccess {
	id: string;
	name: string;
}

interface GroupInstitutionAccess {
	type: InstitutionAccessType;
	districts?: DistrictAccess[];
	categories?: CategoryAccess[];
	institutions?: InstitutionAccess[];
}

interface Group {
	id: string;
	name: string;
	description: string;
	institutionAccess: GroupInstitutionAccess;
	userCount: number;
	institutionCount: number;
	createdAt: Date;
}

const sampleGroups: Group[] = [
	{
		id: "g1",
		name: "Redaktion",
		description: "Editorial group with full access to all institutions",
		institutionAccess: {
			type: "all",
		},
		userCount: 1,
		institutionCount: 234,
		createdAt: new Date("2025-01-15T10:00:00"),
	},
	{
		id: "g2",
		name: "Open Spaces",
		description: "Open Spaces department with category-based access",
		institutionAccess: {
			type: "category",
			categories: [
				{ key: "parks", name: "Parks & Gardens" },
				{ key: "plazas", name: "Public Plazas" },
			],
		},
		userCount: 1,
		institutionCount: 67,
		createdAt: new Date("2025-02-20T14:30:00"),
	},
	{
		id: "g3",
		name: "Custom District",
		description: "District-based access to Mitte institutions",
		institutionAccess: {
			type: "district",
			districts: [{ key: "mitte", name: "Mitte" }],
		},
		userCount: 1,
		institutionCount: 89,
		createdAt: new Date("2025-03-10T09:15:00"),
	},
];

export function GroupsTable() {
	const [groups, setGroups] = useState<Group[]>(sampleGroups);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editedGroup, setEditedGroup] = useState<Group | null>(null);

	const handleEditGroup = (group: Group) => {
		setEditedGroup(group);
		setIsEditModalOpen(true);
	};

	const handleSaveGroup = () => {
		if (editedGroup) {
			setGroups(groups.map((g) => (g.id === editedGroup.id ? editedGroup : g)));
			setIsEditModalOpen(false);
			setEditedGroup(null);
		}
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("de-DE", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold">Groups</h2>
					<p className="text-muted-foreground">
						{groups.length} {groups.length === 1 ? "group" : "groups"} total
					</p>
				</div>
				<Button>
					<Plus className="h-4 w-4 mr-2" />
					Create Group
				</Button>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Users</TableHead>
							<TableHead>Institutions</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="w-[120px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{groups.map((group) => (
							<TableRow key={group.id}>
								<TableCell className="font-medium">{group.name}</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{group.description}
								</TableCell>
								<TableCell>
									<Badge variant="secondary">{group.userCount}</Badge>
								</TableCell>
								<TableCell>
									<Badge variant="outline">{group.institutionCount}</Badge>
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{formatDate(group.createdAt)}
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
											<DropdownMenuItem onClick={() => handleEditGroup(group)}>
												Edit Group
											</DropdownMenuItem>
											<DropdownMenuItem className="text-destructive">
												Delete Group
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Edit Group Modal */}
			<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="text-2xl font-bold">Edit Group</DialogTitle>
						<DialogDescription>
							Make changes to the group details below.
						</DialogDescription>
					</DialogHeader>

					{editedGroup && (
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={editedGroup.name}
									onChange={(e) =>
										setEditedGroup({ ...editedGroup, name: e.target.value })
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Input
									id="description"
									value={editedGroup.description}
									onChange={(e) =>
										setEditedGroup({
											...editedGroup,
											description: e.target.value,
										})
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Members</Label>
								<div className="p-3 bg-muted/50 rounded-xs  border-dashed">
									<p className="text-sm text-muted-foreground">
										User management interface will go here
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Currently {editedGroup.userCount}{" "}
										{editedGroup.userCount === 1 ? "user" : "users"}
									</p>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="accessType">Institution Access</Label>
								<select
									id="accessType"
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									value={editedGroup.institutionAccess.type}
									onChange={(e) =>
										setEditedGroup({
											...editedGroup,
											institutionAccess: {
												...editedGroup.institutionAccess,
												type: e.target.value as InstitutionAccessType,
											},
										})
									}
								>
									<option value="all">Alle (All)</option>
									<option value="district">Distrikt (District)</option>
									<option value="category">Spartenverband (Category)</option>
									<option value="custom">Benutzerdefiniert (Custom)</option>
								</select>

								{editedGroup.institutionAccess.type === "district" && (
									<div className="space-y-2">
										<Label className="text-sm text-muted-foreground">
											Select Districts
										</Label>
										<div className="p-3 bg-muted/50 rounded-md text-sm border-2 border-dashed">
											<p className="text-muted-foreground">
												Multi-select district picker will go here
											</p>
										</div>
									</div>
								)}

								{editedGroup.institutionAccess.type === "category" && (
									<div className="space-y-2">
										<Label className="text-sm text-muted-foreground">
											Select Categories
										</Label>
										<div className="p-3 bg-muted/50 rounded-md text-sm border-2 border-dashed">
											<p className="text-muted-foreground">
												Multi-select category picker will go here
											</p>
										</div>
									</div>
								)}

								{editedGroup.institutionAccess.type === "custom" && (
									<div className="space-y-2">
										<Label className="text-sm text-muted-foreground">
											Select Institutions
										</Label>
										<div className="p-3 bg-muted/50 rounded-md text-sm border-2 border-dashed">
											<p className="text-muted-foreground">
												Institution search and select will go here
											</p>
										</div>
									</div>
								)}

								<div className="p-3 bg-muted rounded-md text-sm">
									<span className="text-muted-foreground">
										Currently: {editedGroup.institutionCount}{" "}
										{editedGroup.institutionCount === 1
											? "institution"
											: "institutions"}
									</span>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Created</Label>
								<div className="p-3 bg-muted rounded-md text-sm">
									{editedGroup.createdAt.toLocaleString("de-DE", {
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
					)}

					<div className="flex justify-end gap-3">
						<Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSaveGroup}>Save Changes</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
