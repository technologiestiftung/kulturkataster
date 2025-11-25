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
import type { Group } from "./types";
import { sampleGroups } from "./constants";
import { GroupRow } from "./GroupRow";
import { GroupEditModal } from "./GroupEditModal";

export function GroupsTable() {
	const [groups, setGroups] = useState<Group[]>(sampleGroups);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editedGroup, setEditedGroup] = useState<Group | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
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

	const filteredGroups = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		if (!term) return groups;

		return groups.filter((group) => {
			const values: string[] = [
				group.name,
				group.description,
				group.institutionAccess.type,
				String(group.userCount),
				String(group.institutionCount),
				group.createdAt.toLocaleDateString(),
			];

			return values.some((value) => value.toLowerCase().includes(term));
		});
	}, [groups, searchTerm]);

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-2xl font-bold">Groups</h2>
					<p className="text-muted-foreground">
						{groups.length} {groups.length === 1 ? "group" : "groups"} total
					</p>
				</div>
				<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
					<Input
						placeholder="Search groups..."
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						className="w-full sm:max-w-xs"
					/>
					<Button onClick={handleAddGroup} className="w-full sm:w-auto">
						<Plus className="h-4 w-4 mr-2" />
						Create Group
					</Button>
				</div>
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
							<TableHead className="w-[110px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredGroups.map((group) => (
							<GroupRow key={group.id} group={group} onEdit={handleEditGroup} />
						))}
					</TableBody>
				</Table>
			</div>

			<GroupEditModal
				group={editedGroup}
				open={isEditModalOpen}
				onOpenChange={handleModalOpenChange}
				onSave={handleSaveGroup}
				onDelete={handleDeleteGroup}
			/>
		</div>
	);
}
