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
}

export function GroupEditModal({
	group,
	open,
	onOpenChange,
	onSave,
}: GroupEditModalProps) {
	const [editedGroup, setEditedGroup] = useState<Group | null>(group);
	const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
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
							onChange={(institutionAccess) =>
								setEditedGroup({
									...editedGroup,
									institutionAccess,
								})
							}
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

				<div className="flex justify-end gap-3">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={!editedGroup}>
						Save Changes
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
