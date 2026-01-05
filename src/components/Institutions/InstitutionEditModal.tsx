"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Institution } from "./types";

interface InstitutionEditModalProps {
	institution: Institution | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (institution: Institution) => void;
	onDelete: (institutionId: string) => void;
}

export function InstitutionEditModal({
	institution,
	open,
	onOpenChange,
	onSave,
	onDelete,
}: InstitutionEditModalProps) {
	const [editedInstitution, setEditedInstitution] =
		useState<Institution | null>(institution);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	useEffect(() => {
		if (open) {
		} else {
		}
	}, [institution, open]);

	const handleSave = () => {
		if (!editedInstitution) return;
		onSave(editedInstitution);
		onOpenChange(false);
	};

	const handleDelete = () => {
		if (!editedInstitution) return;
		onDelete(editedInstitution.id);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent variant="entityEdit" className="max-w-4xl">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">
						Edit Institution
					</DialogTitle>
					<DialogDescription>
						Make changes to the institution details below.
					</DialogDescription>
				</DialogHeader>

				{editedInstitution ? (
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name">Institution Name</Label>
								<Input
									id="name"
									value={editedInstitution.name}
									onChange={(e) =>
										setEditedInstitution({
											...editedInstitution,
											name: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="slug">Slug</Label>
								<Input
									id="slug"
									value={editedInstitution.slug}
									onChange={(e) =>
										setEditedInstitution({
											...editedInstitution,
											slug: e.target.value,
										})
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="type">Type</Label>
								<Select
									value={editedInstitution.type}
									onValueChange={(value) =>
										setEditedInstitution({
											...editedInstitution,
											type: value as Institution["type"],
										})
									}
								>
									<SelectTrigger id="type">
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="museum">Museum</SelectItem>
										<SelectItem value="gallery">Gallery</SelectItem>
										<SelectItem value="theater">Theater</SelectItem>
										<SelectItem value="library">Library</SelectItem>
										<SelectItem value="archive">Archive</SelectItem>
										<SelectItem value="monument">Monument</SelectItem>
										<SelectItem value="other">Other</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="status">Status</Label>
								<Select
									value={editedInstitution.status}
									onValueChange={(value) =>
										setEditedInstitution({
											...editedInstitution,
											status: value as Institution["status"],
										})
									}
								>
									<SelectTrigger id="status">
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">Active</SelectItem>
										<SelectItem value="inactive">Inactive</SelectItem>
										<SelectItem value="pending">Pending</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Input
								id="description"
								value={editedInstitution.description || ""}
								onChange={(e) =>
									setEditedInstitution({
										...editedInstitution,
										description: e.target.value,
									})
								}
								placeholder="Brief description of the institution"
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-base font-semibold">Address</Label>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="street">Street</Label>
									<Input
										id="street"
										value={editedInstitution.address.street}
										onChange={(e) =>
											setEditedInstitution({
												...editedInstitution,
												address: {
													...editedInstitution.address,
													street: e.target.value,
												},
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="city">City</Label>
									<Input
										id="city"
										value={editedInstitution.address.city}
										onChange={(e) =>
											setEditedInstitution({
												...editedInstitution,
												address: {
													...editedInstitution.address,
													city: e.target.value,
												},
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="district">District</Label>
									<Input
										id="district"
										value={editedInstitution.address.district || ""}
										onChange={(e) =>
											setEditedInstitution({
												...editedInstitution,
												address: {
													...editedInstitution.address,
													district: e.target.value,
												},
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="postalCode">Postal Code</Label>
									<Input
										id="postalCode"
										value={editedInstitution.address.postalCode}
										onChange={(e) =>
											setEditedInstitution({
												...editedInstitution,
												address: {
													...editedInstitution.address,
													postalCode: e.target.value,
												},
											})
										}
									/>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-base font-semibold">Contact</Label>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="contactName">Contact Name</Label>
									<Input
										id="contactName"
										value={editedInstitution.contact.name}
										onChange={(e) =>
											setEditedInstitution({
												...editedInstitution,
												contact: {
													...editedInstitution.contact,
													name: e.target.value,
												},
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="contactEmail">Contact Email</Label>
									<Input
										id="contactEmail"
										type="email"
										value={editedInstitution.contact.email}
										onChange={(e) =>
											setEditedInstitution({
												...editedInstitution,
												contact: {
													...editedInstitution.contact,
													email: e.target.value,
												},
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="contactPhone">Contact Phone</Label>
									<Input
										id="contactPhone"
										type="tel"
										value={editedInstitution.contact.phone || ""}
										onChange={(e) =>
											setEditedInstitution({
												...editedInstitution,
												contact: {
													...editedInstitution.contact,
													phone: e.target.value,
												},
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="website">Website</Label>
									<Input
										id="website"
										type="url"
										value={editedInstitution.website || ""}
										onChange={(e) =>
											setEditedInstitution({
												...editedInstitution,
												website: e.target.value,
											})
										}
									/>
								</div>
							</div>
						</div>

						<div className="flex items-center justify-between rounded-md border p-3">
							<div className="space-y-1">
								<Label>Verified</Label>
								<p className="text-xs text-muted-foreground">
									Mark this institution as verified
								</p>
							</div>
							<Switch
								checked={editedInstitution.verified}
								onCheckedChange={(checked) =>
									setEditedInstitution({
										...editedInstitution,
										verified: checked,
									})
								}
							/>
						</div>
					</div>
				) : (
					<div className="py-8 text-center text-sm text-muted-foreground">
						Select an institution to edit.
					</div>
				)}

				<DialogFooter className="flex flex-wrap gap-2">
					{editedInstitution ? (
						<>
							<div className="flex gap-2">
								{!showDeleteConfirm ? (
									<Button
										type="button"
										variant="destructive"
										onClick={() => setShowDeleteConfirm(true)}
									>
										Delete Institution
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
						</>
					) : (
						<div />
					)}
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleSave}
							disabled={!editedInstitution}
						>
							Save Changes
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
