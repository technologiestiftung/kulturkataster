"use client";

import * as React from "react";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Group } from "./types";
import { InstitutionAccessEditor } from "./InstitutionAccessEditor";
import { UserSelector } from "./UserSelector";

interface GroupEditModalProps {
	group: Group | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (group: Group) => void;
	onDelete: (groupId: string) => void;
}

export function GroupEditModal({
	group,
	open,
	onOpenChange,
	onSave,
	onDelete,
}: GroupEditModalProps) {
	const [editedGroup, setEditedGroup] = useState<Group | null>(group);
	const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const restorePointerEvents = () => {
		if (typeof document === "undefined") return;
		if (document.body.style.pointerEvents === "none") {
			document.body.style.pointerEvents = "";
		}
	};

	React.useEffect(() => {
		if (open) {
			setEditedGroup(group);
		} else {
			setEditedGroup(null);
			restorePointerEvents();
		}
		setSelectedUserIds([]);
		setShowDeleteConfirm(false);
	}, [group, open]);

	React.useEffect(() => {
		return () => {
			restorePointerEvents();
		};
	}, []);

	const handleSave = () => {
		if (!editedGroup) return;
		onSave(editedGroup);
		onOpenChange(false);
	};

	const handleAccessChange = (access: Group["institutionAccess"]) => {
		setEditedGroup((current) => {
			if (!current) return current;

			const derivedCount =
				access.type === "custom" || access.type === "category"
					? access.institutions?.length || 0
					: current.institutionCount;

			return {
				...current,
				institutionAccess: access,
				institutionCount: derivedCount,
			};
		});
	};

	const handleDelete = () => {
		if (!editedGroup) return;
		onDelete(editedGroup.id);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent variant="entityEdit" className="max-w-4xl">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">Edit Group</DialogTitle>
					<DialogDescription>
						Make changes to the group details below.
					</DialogDescription>
				</DialogHeader>

				{editedGroup ? (
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
							<UserSelector
								selectedUserIds={selectedUserIds}
								onChange={(userIds) => {
									setSelectedUserIds(userIds);
									setEditedGroup({
										...editedGroup,
										userCount: userIds.length,
									});
								}}
							/>
							<p className="text-xs text-muted-foreground">
								{selectedUserIds.length}{" "}
								{selectedUserIds.length === 1 ? "user" : "users"} selected
							</p>
						</div>

						<InstitutionAccessEditor
							access={editedGroup.institutionAccess}
							institutionCount={editedGroup.institutionCount}
							onChange={handleAccessChange}
						/>

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
				) : (
					<div className="py-8 text-center text-sm text-muted-foreground">
						Select a group to begin editing.
					</div>
				)}

				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					{editedGroup ? (
						<div>
							{!showDeleteConfirm ? (
								<Button
									variant="destructive"
									onClick={() => setShowDeleteConfirm(true)}
								>
									Delete Group
								</Button>
							) : (
								<div className="flex gap-2">
									<Button variant="destructive" onClick={handleDelete}>
										Confirm Delete
									</Button>
									<Button
										variant="outline"
										onClick={() => setShowDeleteConfirm(false)}
									>
										Cancel
									</Button>
								</div>
							)}
						</div>
					) : (
						<div />
					)}
					<div className="flex gap-2">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={!editedGroup}>
							Save Changes
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
