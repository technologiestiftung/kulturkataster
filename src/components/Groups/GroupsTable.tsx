"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableConfig } from "@/components/shared/DataTable";
import type { Group } from "./types";
import { sampleGroups } from "./constants";
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
			setGroups(groups.map((g) => (g.id === group.id ? group : g)));
		} else {
			setGroups([...groups, group]);
		}
		setIsEditModalOpen(false);
		setEditedGroup(null);
	};

	const handleDeleteGroup = (groupId: string) => {
		setGroups(groups.filter((g) => g.id !== groupId));
		setIsEditModalOpen(false);
		setEditedGroup(null);
	};

	// Configure the table
	const tableConfig: DataTableConfig<Group> = {
		columns: [
			{
				key: "name",
				label: "Name",
				sortable: true,
				getValue: (row) => row.name,
			},
			{
				key: "description",
				label: "Description",
				sortable: true,
				getValue: (row) => row.description,
			},
			{
				key: "userCount",
				label: "Users",
				sortable: true,
				getValue: (row) => row.userCount,
			},
			{
				key: "institutionCount",
				label: "Institutions",
				sortable: true,
				getValue: (row) => row.institutionCount,
			},
			{
				key: "createdAt",
				label: "Created",
				sortable: true,
				getValue: (row) => row.createdAt,
			},
		],
		data: groups,
		getRowKey: (row) => row.id,
		searchable: true,
		searchPlaceholder: "Search groups...",
		getSearchableValues: (row) => [
			row.name,
			row.description,
			row.institutionAccess.type,
			String(row.userCount),
			String(row.institutionCount),
			row.createdAt.toLocaleDateString(),
		],
		addButton: {
			label: "Create Group",
			onClick: handleAddGroup,
		},
		onEdit: handleEditGroup,
		emptyMessage: "No groups found.",
		title: "Groups",
		subtitle: `${groups.length} ${groups.length === 1 ? "group" : "groups"} total`,
	};

	return (
		<>
			<DataTable config={tableConfig} />

			<GroupEditModal
				group={editedGroup}
				open={isEditModalOpen}
				onOpenChange={handleModalOpenChange}
				onSave={handleSaveGroup}
				onDelete={handleDeleteGroup}
			/>
		</>
	);
}
