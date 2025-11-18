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
import type { Group } from "./types";
import { sampleGroups } from "./constants";
import { GroupRow } from "./GroupRow";
import { GroupEditModal } from "./GroupEditModal";

export function GroupsTable() {
	const [groups, setGroups] = useState<Group[]>(sampleGroups);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editedGroup, setEditedGroup] = useState<Group | null>(null);
	const handleModalOpenChange = (nextOpen: boolean) => {
		setIsEditModalOpen(nextOpen);
		if (!nextOpen) {
			setEditedGroup(null);
		}
	};

	const handleEditGroup = (group: Group) => {
		setEditedGroup(group);
		setIsEditModalOpen(true);
	};

	const handleAddGroup = () => {
		const newGroup: Group = {
			id: Date.now().toString(),
			name: "",
			description: "",
			institutionAccess: {
				type: "all",
			},
			userCount: 0,
			institutionCount: 0,
			createdAt: new Date(),
		};
		setEditedGroup(newGroup);
		setIsEditModalOpen(true);
	};

	const handleSaveGroup = (group: Group) => {
		const exists = groups.some((g) => g.id === group.id);
		if (exists) {
			// Update existing group
			setGroups(groups.map((g) => (g.id === group.id ? group : g)));
		} else {
			// Add new group
			setGroups([...groups, group]);
		}
		setIsEditModalOpen(false);
		setEditedGroup(null);
	};

	const handleDeleteGroup = (groupId: string) => {
		console.log("Delete group:", groupId);
		// TODO: Implement delete group functionality
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
				<Button onClick={handleAddGroup}>
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
							<GroupRow
								key={group.id}
								group={group}
								onEdit={handleEditGroup}
								onDelete={handleDeleteGroup}
							/>
						))}
					</TableBody>
				</Table>
			</div>

			<GroupEditModal
				group={editedGroup}
				open={isEditModalOpen}
				onOpenChange={handleModalOpenChange}
				onSave={handleSaveGroup}
			/>
		</div>
	);
}
